import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TestStatus, GiftStatus, PaymentStatus, TransactionType, TransactionStatus } from "@prisma/client";
import crypto from "crypto";
import { sendSMS } from "@/lib/messaging";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    // 1. Find the test by token
    const test = await prisma.loyaltyTest.findUnique({
      where: { testToken: token },
      include: { sender: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
    }

    // 2. Block access if payment has not been verified (SUCCESSFUL)
    if (test.paymentStatus !== PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({ 
        error: "This verification link has not been funded yet." 
      }, { status: 403 });
    }

    let finalTest = test;

    // 3. Check if the test has expired dynamically
    if (test.testStatus === TestStatus.ACTIVE && new Date() > test.expiresAt) {
      // Capture non-null reference for closure
      const activeTest = test;
      
      // Query refund rules setting
      const refundRuleSetting = await prisma.platformSetting.findUnique({
        where: { key: "refund_rules" }
      });
      const refundRule = refundRuleSetting ? refundRuleSetting.value : "wallet_refund";
      const shouldRefund = refundRule === "wallet_refund";

      let targetGiftStatus: GiftStatus = GiftStatus.REFUNDED;
      if (refundRule !== "wallet_refund") {
        const upper = refundRule.toUpperCase();
        if (Object.values(GiftStatus).includes(upper as GiftStatus)) {
          targetGiftStatus = upper as GiftStatus;
        }
      }

      // Execute auto-refund of escrow gift back to sender
      finalTest = await prisma.$transaction(async (tx) => {
        // Update test status to EXPIRED
        const updatedTest = await tx.loyaltyTest.update({
          where: { id: activeTest.id },
          data: {
            testStatus: TestStatus.EXPIRED,
            giftStatus: shouldRefund ? GiftStatus.REFUNDED : targetGiftStatus,
          },
          include: { sender: true }
        });

        if (shouldRefund) {
          // Find sender wallet
          const senderWallet = await tx.wallet.findUnique({
            where: { userId: activeTest.senderId },
          });

          if (senderWallet) {
            // Increment sender wallet by gift amount
            const updatedWallet = await tx.wallet.update({
              where: { id: senderWallet.id },
              data: {
                balance: {
                  increment: activeTest.giftAmount,
                },
              },
            });

            // Record transaction log
            const refundRef = `TX-REFUND-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
            await tx.walletTransaction.create({
              data: {
                walletId: senderWallet.id,
                userId: activeTest.senderId,
                transactionType: TransactionType.REFUND,
                amount: activeTest.giftAmount,
                balanceBefore: senderWallet.balance,
                balanceAfter: updatedWallet.balance,
                reference: refundRef,
                description: `Auto-refund of ₦${activeTest.giftAmount.toLocaleString()} escrow for expired loyalty test to ${activeTest.receiverName}`,
                status: TransactionStatus.SUCCESSFUL,
              },
            });
          }
        }

        return updatedTest;
      });

      // Send SMS asynchronously outside transaction boundary
      const amountStr = activeTest.giftAmount.toLocaleString();
      let smsMessage = "";
      if (shouldRefund) {
        smsMessage = `Your loyalty test link to ${activeTest.receiverName} has expired without being answered. The locked reward of ₦${amountStr} has been refunded back to your wallet.`;
      } else {
        smsMessage = `Your loyalty test link to ${activeTest.receiverName} has expired without being answered. The locked reward of ₦${amountStr} was not refunded based on platform settings.`;
      }

      if (activeTest.sender && activeTest.sender.phoneNumber) {
        sendSMS(activeTest.sender.phoneNumber, smsMessage).catch((err) => {
          console.error("❌ Failed to send SMS to sender:", err);
        });
      }
    }

    // 4. Return masked public details
    return NextResponse.json({
      test: {
        id: finalTest.id,
        receiverName: finalTest.receiverName,
        questionText: finalTest.questionText,
        giftType: finalTest.giftType,
        giftAmount: finalTest.giftAmount,
        testStatus: finalTest.testStatus,
        resultStatus: finalTest.resultStatus,
        expiresAt: finalTest.expiresAt,
        createdAt: finalTest.createdAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Fetch receiver test details error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
