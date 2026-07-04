import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TestStatus, GiftStatus, ResultStatus, RewardStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { calculateMatchScore } from "@/lib/matcher";
import { decrypt } from "@/lib/crypto";
import crypto from "crypto";
import { sendSMS } from "@/lib/messaging";

// Detect network based on Nigeria phone number prefix
function detectNetwork(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (/^(?:234|0)(?:803|806|703|706|903|906|813|814|816|913|916)/.test(clean)) return "MTN";
  if (/^(?:234|0)(?:802|808|701|708|812|902|907|901|912)/.test(clean)) return "AIRTEL";
  if (/^(?:234|0)(?:805|807|705|815|905|915)/.test(clean)) return "GLO";
  return "9MOBILE";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const { answer } = body;

    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    // 1. Fetch test
    const test = await prisma.loyaltyTest.findUnique({
      where: { testToken: token },
      include: { sender: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
    }

    if (test.testStatus !== TestStatus.ACTIVE) {
      return NextResponse.json({ error: `This test has already been ${test.testStatus.toLowerCase()}.` }, { status: 400 });
    }

    // Check if expired
    if (new Date() > test.expiresAt) {
      return NextResponse.json({ error: "This test link has expired." }, { status: 400 });
    }

    // 2. Decrypt and match expected answer
    const expectedRaw = decrypt(test.expectedAnswerEncrypted);
    const score = calculateMatchScore(expectedRaw, answer);

    // Read matching thresholds and modes from platform settings
    const passThresholdSetting = await prisma.platformSetting.findUnique({ where: { key: "pass_threshold" } });
    const partialPassThresholdSetting = await prisma.platformSetting.findUnique({ where: { key: "partial_pass_threshold" } });
    const matchingModeSetting = await prisma.platformSetting.findUnique({ where: { key: "matching_mode" } });
    const partialPassUnlocksSetting = await prisma.platformSetting.findUnique({ where: { key: "partial_pass_unlocks_gift" } });

    let passThreshold = passThresholdSetting ? parseInt(passThresholdSetting.value, 10) : 90;
    let partialPassThreshold = partialPassThresholdSetting ? parseInt(partialPassThresholdSetting.value, 10) : 50;
    const matchingMode = matchingModeSetting ? matchingModeSetting.value : "normal";
    const partialPassUnlocksGift = partialPassUnlocksSetting ? partialPassUnlocksSetting.value === "true" : false;

    if (matchingMode === "strict") {
      passThreshold = 95;
      partialPassThreshold = 70;
    } else if (matchingMode === "flexible") {
      passThreshold = 80;
      partialPassThreshold = 30;
    }

    let resultStatus: ResultStatus = ResultStatus.FAILED;
    if (score >= passThreshold) {
      resultStatus = ResultStatus.PASSED;
    } else if (score >= partialPassThreshold) {
      resultStatus = ResultStatus.PARTIAL_PASS;
    }

    const isPass = resultStatus === ResultStatus.PASSED || (resultStatus === ResultStatus.PARTIAL_PASS && partialPassUnlocksGift);

    // Get IP and User Agent headers for logging
    const ip = request.headers.get("x-forwarded-for") || "";
    const userAgent = request.headers.get("user-agent") || "";

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

    // 3. Execute atomic verification (release gift or refund sender)
    const transactionResult = await prisma.$transaction(async (tx) => {
      // a. Save response log
      const response = await tx.testResponse.create({
        data: {
          testId: test.id,
          receiverAnswer: answer.trim(),
          receiverAnswerNormalized: answer.trim().toLowerCase(),
          matchScore: score,
          resultStatus,
          ipAddress: ip,
          userAgent,
        },
      });

      // b. Update test with result details
      const updatedTest = await tx.loyaltyTest.update({
        where: { id: test.id },
        data: {
          testStatus: TestStatus.COMPLETED,
          resultStatus,
          matchScore: score,
          submittedAt: new Date(),
          giftStatus: isPass ? GiftStatus.RELEASED : targetGiftStatus,
        },
      });

      if (isPass) {
        // Release: Create Reward dispatch record
        const detectedNetwork = detectNetwork(test.receiverPhone);
        await tx.reward.create({
          data: {
            testId: test.id,
            senderId: test.senderId,
            receiverPhone: test.receiverPhone,
            rewardType: test.giftType,
            network: detectedNetwork,
            amount: test.giftAmount,
            provider: "MOCK",
            providerReference: `MOCK-REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            status: RewardStatus.SUCCESSFUL,
            deliveredAt: new Date(),
          },
        });
      } else if (shouldRefund) {
        // Refund: Find sender wallet and increment balance
        const wallet = await tx.wallet.findUnique({
          where: { userId: test.senderId },
        });

        if (wallet) {
          const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                increment: test.giftAmount,
              },
            },
          });

          // Create refund wallet transaction
          const txRef = `TX-REFUND-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: test.senderId,
              transactionType: TransactionType.REFUND,
              amount: test.giftAmount,
              balanceBefore: wallet.balance,
              balanceAfter: updatedWallet.balance,
              reference: txRef,
              description: `Refund of ₦${test.giftAmount.toLocaleString()} escrow due to receiver failing test verification`,
              status: TransactionStatus.SUCCESSFUL,
            },
          });
        }
      }

      return { updatedTest, response };
    });

    // Send SMS asynchronously outside transaction boundary
    const amountStr = test.giftAmount.toLocaleString();
    const scorePercent = Math.round(score);
    let smsMessage = "";
    if (isPass) {
      smsMessage = `Your loyalty test to ${test.receiverName} was completed successfully! They passed with ${scorePercent}%. The reward of ₦${amountStr} has been released.`;
    } else {
      if (shouldRefund) {
        smsMessage = `Your loyalty test to ${test.receiverName} was completed. They failed with ${scorePercent}%. The locked gift of ₦${amountStr} has been refunded to your wallet.`;
      } else {
        smsMessage = `Your loyalty test to ${test.receiverName} was completed. They failed with ${scorePercent}%. The locked gift of ₦${amountStr} was not refunded based on platform settings.`;
      }
    }

    if (test.sender && test.sender.phoneNumber) {
      sendSMS(test.sender.phoneNumber, smsMessage).catch((err) => {
        console.error("❌ Failed to send SMS to sender:", err);
      });
    }

    return NextResponse.json({
      message: isPass 
        ? "Verification successful! Gift unlocked." 
        : (shouldRefund 
            ? "Verification failed. Unlocked gift refunded back to Sender."
            : "Verification failed. Unlocked gift processed according to platform settings."),
      score,
      resultStatus,
      testStatus: transactionResult.updatedTest.testStatus,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Submit receiver test error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
