import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TestStatus, GiftStatus, TransactionType, TransactionStatus } from "@prisma/client";
import crypto from "crypto";
import { sendSMS } from "@/lib/messaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { reason = "Blocked by receiver via verification test link" } = body;

    // 1. Find the test
    const test = await prisma.loyaltyTest.findUnique({
      where: { testToken: token },
      include: { sender: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
    }

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

    let isCancelled = false;

    // 2. Perform atomic blocking transaction
    await prisma.$transaction(async (tx) => {
      // Add receiver's phone number to BlockedNumber list
      await tx.blockedNumber.upsert({
        where: { phoneNumber: test.receiverPhone },
        create: {
          phoneNumber: test.receiverPhone,
          reason,
          blockedBy: "RECEIVER",
        },
        update: {},
      });

      // If test is currently ACTIVE, cancel it and refund the sender
      if (test.testStatus === TestStatus.ACTIVE) {
        isCancelled = true;
        await tx.loyaltyTest.update({
          where: { id: test.id },
          data: {
            testStatus: TestStatus.DECLINED,
            giftStatus: shouldRefund ? GiftStatus.REFUNDED : targetGiftStatus,
          },
        });

        if (shouldRefund) {
          // Find sender wallet
          const wallet = await tx.wallet.findUnique({
            where: { userId: test.senderId },
          });

          if (wallet) {
            // Increment wallet balance by gift amount
            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  increment: test.giftAmount,
                },
              },
            });

            // Record refund ledger log
            const refundRef = `TX-REFUND-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId: test.senderId,
                transactionType: TransactionType.REFUND,
                amount: test.giftAmount,
                balanceBefore: wallet.balance,
                balanceAfter: updatedWallet.balance,
                reference: refundRef,
                description: `Escrow refund of ₦${test.giftAmount.toLocaleString()} because receiver blocked their phone number from relationship testing`,
                status: TransactionStatus.SUCCESSFUL,
              },
            });
          }
        }
      }
    });

    if (isCancelled) {
      // Send SMS asynchronously outside transaction boundary
      const amountStr = test.giftAmount.toLocaleString();
      let smsMessage = "";
      if (shouldRefund) {
        smsMessage = `Your loyalty test to ${test.receiverName} was cancelled because the receiver blocked their number. The locked reward of ₦${amountStr} has been refunded to your wallet.`;
      } else {
        smsMessage = `Your loyalty test to ${test.receiverName} was cancelled because the receiver blocked their number. The locked reward of ₦${amountStr} was not refunded based on platform settings.`;
      }

      if (test.sender && test.sender.phoneNumber) {
        sendSMS(test.sender.phoneNumber, smsMessage).catch((err) => {
          console.error("❌ Failed to send SMS to sender:", err);
        });
      }
    }

    return NextResponse.json({ 
      message: "Your phone number has been successfully blocked from future tests. Active link was cancelled and refunded." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Block receiver phone number error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
