import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, PaymentStatus, GiftStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { sendWhatsApp, sendSMS } from "@/lib/messaging";
import { normalizeWhatsAppPhoneE164, getWasenderApiSessionStatus } from "@/lib/messaging/wasenderapi";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require authenticated sender
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id: testId } = await context.params;
    const userId = session.userId;
    const body = await request.json().catch(() => ({}));
    const channelInput = (body.channel || "whatsapp").toLowerCase();

    if (channelInput !== "whatsapp" && channelInput !== "sms") {
      return NextResponse.json({ error: "Invalid channel. Choose whatsapp or sms." }, { status: 400 });
    }

    // 2. Confirm the loyalty test exists and belongs to the logged-in sender
    const test = await prisma.loyaltyTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: "test not found" }, { status: 404 });
    }

    if (test.senderId !== userId) {
      return NextResponse.json({ error: "test does not belong to sender" }, { status: 403 });
    }

    // 3. Confirm testStatus is ACTIVE
    if (test.testStatus !== TestStatus.ACTIVE) {
      return NextResponse.json({ error: "test not active" }, { status: 400 });
    }

    // 4. Confirm paymentStatus is SUCCESSFUL
    if (test.paymentStatus !== PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({ error: "test not funded" }, { status: 400 });
    }

    // 5. Confirm giftStatus is ESCROW or funded equivalent
    if (test.giftStatus !== GiftStatus.ESCROW) {
      return NextResponse.json({ error: "test not funded" }, { status: 400 });
    }

    // 6. Confirm receiver phone is not blocked
    const isBlocked = await prisma.blockedNumber.findUnique({
      where: { phoneNumber: test.receiverPhone },
    });
    if (process.env.NODE_ENV !== "development" && isBlocked) {
      return NextResponse.json({ error: "receiver blocked" }, { status: 400 });
    }

    // 7. Enforce one reminder only using reminderSentAt
    if (process.env.NODE_ENV !== "development" && test.reminderSentAt) {
      return NextResponse.json({ error: "reminder already sent" }, { status: 400 });
    }

    // 8. Phone number validation: clean and check length
    const cleanPhone = test.receiverPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "invalid phone number" }, { status: 400 });
    }

    // 9. Check specific feature flag based on selected channel
    if (channelInput === "whatsapp") {
      const flag = await prisma.featureFlag.findUnique({
        where: { featureName: "whatsapp_sending" },
      });
      if (flag && !flag.enabled) {
        return NextResponse.json({ error: "WhatsApp reminder sending is disabled" }, { status: 400 });
      }
    } else {
      const flag = await prisma.featureFlag.findUnique({
        where: { featureName: "sms_sending" },
      });
      if (flag && !flag.enabled) {
        return NextResponse.json({ error: "SMS reminder sending is disabled" }, { status: 400 });
      }
    }

    // 10. Generate the public receiver URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const testLink = `${origin}/t/${test.testToken}`;
    const textMessage = `You have a secured relationship gift waiting. Open your private link to respond safely: ${testLink}. Do not enter passwords, OTPs, bank details, card details, BVN, NIN, or private account information.`;

    // ----------------------------------------------------
    // WHATSAPP CHANNEL DISPATCH FLOW
    // ----------------------------------------------------
    if (channelInput === "whatsapp") {
      const whatsappProvider = (process.env.WHATSAPP_PROVIDER || "mock").toLowerCase();

      // Check WasenderAPI session status before sending
      if (whatsappProvider === "wasenderapi") {
        try {
          const sessionRes = await getWasenderApiSessionStatus();
          const sessionStatus = sessionRes.status || sessionRes.data?.status || (sessionRes.success && sessionRes.data ? "connected" : "disconnected");
          
          if (sessionStatus !== "connected") {
            // Log the failed attempt to database
            try {
              await prisma.messageLog.create({
                data: {
                  testId: test.id,
                  userId: test.senderId,
                  channel: "WHATSAPP",
                  provider: "wasenderapi",
                  recipientPhone: test.receiverPhone,
                  status: "FAILED",
                  providerStatus: sessionStatus,
                  errorCode: "SESSION_NOT_CONNECTED",
                  errorMessage: "WhatsApp session is not connected. Please reconnect WasenderAPI session.",
                  requestPayload: {
                    to: normalizeWhatsAppPhoneE164(test.receiverPhone),
                  },
                  responsePayload: sessionRes
                }
              });
            } catch (logError) {
              console.error("[MessageLog Error] Could not write message log to database:", logError);
            }

            return NextResponse.json({
              success: false,
              provider: "wasenderapi",
              channel: "WHATSAPP",
              stage: "SESSION_NOT_CONNECTED",
              message: "WhatsApp session is not connected. Please reconnect WasenderAPI session.",
            }, { status: 400 });
          }
        } catch (sessionErr: any) {
          console.error("❌ Session status check error:", sessionErr);
          return NextResponse.json({
            success: false,
            provider: "wasenderapi",
            channel: "WHATSAPP",
            stage: "SESSION_CHECK_FAILED",
            message: "Could not verify WhatsApp provider session status.",
            error: sessionErr.message || "Session API connection exception."
          }, { status: 400 });
        }
      }

      // Send WhatsApp message
      const whatsappResult = await sendWhatsApp(test.receiverPhone, testLink);

      // Write log to database
      try {
        await prisma.messageLog.create({
          data: {
            testId: test.id,
            userId: test.senderId,
            channel: "WHATSAPP",
            provider: whatsappResult.provider,
            recipientPhone: test.receiverPhone,
            status: whatsappResult.success ? "SUCCESSFUL" : "FAILED",
            providerStatus: whatsappResult.providerStatus ? String(whatsappResult.providerStatus) : (whatsappResult.debug?.httpStatus ? String(whatsappResult.debug.httpStatus) : (whatsappResult.success ? "SUCCESS" : "FAILED")),
            providerMessageId: whatsappResult.providerMessageId ? String(whatsappResult.providerMessageId) : null,
            errorCode: whatsappResult.stage,
            errorMessage: whatsappResult.error || null,
            requestPayload: {
              to: normalizeWhatsAppPhoneE164(test.receiverPhone),
              text: textMessage
            },
            responsePayload: whatsappResult.debug?.providerResponse || whatsappResult.debug?.brevoResponse || (whatsappResult.success ? { success: true } : { success: false, error: whatsappResult.error })
          }
        });
      } catch (logError) {
        console.error("[MessageLog Error] Could not write message log to database:", logError);
      }

      if (!whatsappResult.success) {
        return NextResponse.json({
          success: false,
          provider: whatsappResult.provider,
          channel: whatsappResult.channel,
          stage: whatsappResult.stage,
          message: whatsappResult.message || "WhatsApp could not be sent. Please check the provider setup.",
          error: whatsappResult.error,
          debug: whatsappResult.debug
        }, { status: whatsappResult.debug?.httpStatus || 400 });
      }

      // Update reminderSentAt only after successful WhatsApp send
      const updatedTest = await prisma.loyaltyTest.update({
        where: { id: test.id },
        data: {
          reminderSentAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "WhatsApp reminder sent successfully!",
        reminderSentAt: updatedTest.reminderSentAt,
      }, { status: 200 });
    }

    // ----------------------------------------------------
    // SMS CHANNEL DISPATCH FLOW
    // ----------------------------------------------------
    const smsProvider = (process.env.SMS_PROVIDER || "mock").toLowerCase();

    // Read sms_fee from platform_settings, defaulting to 15 if missing
    const costSetting = await prisma.platformSetting.findUnique({
      where: { key: "sms_fee" },
    });
    const smsFee = costSetting ? parseFloat(costSetting.value) : 15;

    // Confirm sender wallet balance is enough
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < smsFee) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Send SMS via BulkSMSNigeria
    const smsResult = await sendSMS(test.receiverPhone, textMessage);

    // Save MessageLog record for the attempt
    try {
      await prisma.messageLog.create({
        data: {
          testId: test.id,
          userId: test.senderId,
          channel: "SMS",
          provider: smsProvider,
          recipientPhone: test.receiverPhone,
          status: smsResult.success ? "SUCCESSFUL" : "FAILED",
          providerStatus: smsResult.success ? "SUCCESS" : "FAILED",
          providerMessageId: smsResult.messageId ? String(smsResult.messageId) : null,
          errorCode: smsResult.success ? null : "SMS_SEND_FAILED",
          errorMessage: smsResult.error || null,
          requestPayload: {
            to: test.receiverPhone,
            text: textMessage
          },
          responsePayload: smsResult.success ? { success: true, messageId: smsResult.messageId } : { success: false, error: smsResult.error }
        }
      });
    } catch (logError) {
      console.error("[MessageLog Error] Could not write message log to database:", logError);
    }

    if (!smsResult.success) {
      return NextResponse.json({
        success: false,
        provider: smsProvider,
        channel: "SMS",
        message: "SMS could not be sent. Please check the provider setup.",
        error: smsResult.error
      }, { status: 400 });
    }

    // Debit sender wallet atomically after successful SMS send, update reminderSentAt
    const updatedTest = await prisma.$transaction(async (tx) => {
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

      return await tx.loyaltyTest.update({
        where: { id: test.id },
        data: {
          reminderSentAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "SMS reminder sent successfully!",
      reminderSentAt: updatedTest.reminderSentAt,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Send message exception:", error);
    return NextResponse.json({
      success: false,
      provider: "wasenderapi",
      channel: "WHATSAPP",
      stage: "SERVER_EXCEPTION",
      message: "Message could not be sent. Check provider debug details on the server.",
      error: error.message || "Internal server exception."
    }, { status: 500 });
  }
}
