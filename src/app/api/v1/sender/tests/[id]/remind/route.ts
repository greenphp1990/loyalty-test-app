import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, PaymentStatus, TransactionType, TransactionStatus, GiftStatus } from "@prisma/client";
import { sendSMS, generateWhatsAppUrl } from "@/lib/messaging";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require authenticated sender
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const { id: testId } = await context.params;
    const userId = session.userId;
    const body = await request.json().catch(() => ({}));
    const channel = body.channel || body.method || "SMS"; // SMS or WHATSAPP

    if (channel !== "SMS" && channel !== "WHATSAPP") {
      return NextResponse.json({ error: "Invalid reminder channel. Choose SMS or WHATSAPP." }, { status: 400 });
    }

    // 2. Confirm the loyalty test belongs to the logged-in sender
    const test = await prisma.loyaltyTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.senderId !== userId) {
      return NextResponse.json({ error: "Test does not belong to sender" }, { status: 403 });
    }

    // 3. Confirm testStatus is ACTIVE
    if (test.testStatus !== TestStatus.ACTIVE) {
      return NextResponse.json({ error: "Test not active" }, { status: 400 });
    }

    // 4. Confirm paymentStatus is SUCCESSFUL
    if (test.paymentStatus !== PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({ error: "Test not funded" }, { status: 400 });
    }

    // 5. Confirm giftStatus is ESCROW or funded equivalent
    if (test.giftStatus !== GiftStatus.ESCROW) {
      return NextResponse.json({ error: "Test not funded" }, { status: 400 });
    }

    // 6. Confirm receiver phone is not blocked
    const isBlocked = await prisma.blockedNumber.findUnique({
      where: { phoneNumber: test.receiverPhone },
    });
    if (isBlocked) {
      return NextResponse.json({ error: "Receiver phone blocked" }, { status: 400 });
    }

    // 7. Enforce one reminder only using reminderSentAt
    if (process.env.NODE_ENV !== "development" && test.reminderSentAt) {
      return NextResponse.json({ error: "Reminder already sent" }, { status: 400 });
    }

    // Phone number validation: clean and check length
    const cleanPhone = test.receiverPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Check reminders feature flag globally
    const remindersFlag = await prisma.featureFlag.findUnique({
      where: { featureName: "reminders" },
    });
    if (remindersFlag && !remindersFlag.enabled) {
      return NextResponse.json({ error: "SMS feature disabled" }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const testLink = `${origin}/t/${test.testToken}`;
    const message = `You have a secured relationship gift waiting. Open your private link to respond safely: ${testLink}. Do not enter passwords, OTPs, bank details, card details, BVN, NIN, or private account information.`;

    if (channel === "SMS") {
      // 8. Check the sms_sending feature flag
      const smsFlag = await prisma.featureFlag.findUnique({
        where: { featureName: "sms_sending" },
      });
      if (smsFlag && !smsFlag.enabled) {
        return NextResponse.json({ error: "SMS feature disabled" }, { status: 400 });
      }

      // 9. Read sms_fee from platform_settings, defaulting to 15 if missing
      const costSetting = await prisma.platformSetting.findUnique({
        where: { key: "sms_fee" },
      });
      const smsFee = costSetting ? parseFloat(costSetting.value) : 15;

      // 10. Confirm sender wallet balance is enough
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < smsFee) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      // 11. Send SMS through BulkSMSNigeria (which calls Bulksmsnigeria client under the hood)
      const smsResult = await sendSMS(test.receiverPhone, message);
      if (!smsResult.success) {
        return NextResponse.json({ 
          error: `BulkSMSNigeria API failure: ${smsResult.error || "Unknown carrier timeout."}` 
        }, { status: 502 });
      }

      // 12. Debit sender wallet atomically after successful SMS send
      // 13. Create WalletTransaction with charge details
      // 14. Update reminderSentAt only after successful SMS send
      await prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: smsFee,
            },
          },
        });

        const txRef = `TX-SMS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            transactionType: TransactionType.CHARGE,
            amount: smsFee,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            reference: txRef,
            description: "SMS reminder charge",
            status: TransactionStatus.SUCCESSFUL,
          },
        });

        await tx.loyaltyTest.update({
          where: { id: test.id },
          data: {
            reminderSentAt: new Date(),
          },
        });
      });

      // 15. Return safe JSON response
      return NextResponse.json({
        message: "SMS reminder sent successfully!",
        reminderSentAt: new Date(),
      }, { status: 200 });

    } else {
      // Handle WhatsApp reminder (Generates link, no wallet deduction)
      const waUrl = generateWhatsAppUrl(test.receiverPhone, message);

      await prisma.loyaltyTest.update({
        where: { id: test.id },
        data: {
          reminderSentAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "WhatsApp reminder link generated successfully!",
        whatsappUrl: waUrl,
        reminderSentAt: new Date(),
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error("❌ Send reminder error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
