import prisma from "@/lib/prisma";
import { PaymentStatus, TestStatus, GiftStatus, TransactionType, TransactionStatus, ReferralStatus } from "@prisma/client";
import crypto from "crypto";

/**
 * Handle successful payment updates atomically.
 * Updates payment status, activates loyalty tests, releases wallet credits,
 * and tracks referral payouts if applicable.
 */
export async function handlePaymentSuccess(paymentId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch payment
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error(`Payment record ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.SUCCESSFUL) {
      return payment; // Already processed
    }

    // 2. Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCESSFUL,
        paidAt: new Date(),
      },
    });

    // 3. Side effects based on payment type
    if (payment.paymentType === "TEST_FUNDING" && payment.testId) {
      // Update LoyaltyTest
      await tx.loyaltyTest.update({
        where: { id: payment.testId },
        data: {
          paymentStatus: PaymentStatus.SUCCESSFUL,
          testStatus: TestStatus.ACTIVE,
          giftStatus: GiftStatus.ESCROW,
        },
      });

      // Handle referrals check (qualifying first payment)
      const referral = await tx.referral.findUnique({
        where: { referredUserId: payment.userId },
      });

      if (referral && referral.status === ReferralStatus.PENDING) {
        // Read setting
        const commissionSetting = await tx.platformSetting.findUnique({
          where: { key: "referral_commission" },
        });
        const commission = commissionSetting ? parseFloat(commissionSetting.value) : 50;

        // Update referral
        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: ReferralStatus.PAID,
            commissionAmount: commission,
            qualifyingPaymentId: payment.id,
          },
        });

        // Fund referrer wallet
        const referrerWallet = await tx.wallet.findUnique({
          where: { userId: referral.referrerId },
        });

        if (referrerWallet) {
          const updatedWallet = await tx.wallet.update({
            where: { id: referrerWallet.id },
            data: {
              balance: {
                increment: commission,
              },
            },
          });

          // Create ledger log for referrer
          await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              userId: referral.referrerId,
              transactionType: TransactionType.DEPOSIT,
              amount: commission,
              balanceBefore: referrerWallet.balance,
              balanceAfter: updatedWallet.balance,
              reference: `TX-REF-${crypto.randomUUID()}`,
              description: `Referral commission for user signup first payment`,
              status: TransactionStatus.SUCCESSFUL,
            },
          });
        }
      }

    } else if (payment.paymentType === "WALLET_FUNDING") {
      // Fund wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: payment.userId },
      });

      if (wallet) {
        // Double check transaction idempotency
        const txRef = `TX-DEP-${payment.gatewayReference}`;
        const existingTx = await tx.walletTransaction.findUnique({
          where: { reference: txRef },
        });

        if (!existingTx) {
          const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: payment.userId,
              transactionType: TransactionType.DEPOSIT,
              amount: payment.amount,
              balanceBefore: wallet.balance,
              balanceAfter: updatedWallet.balance,
              reference: txRef,
              description: `Wallet funded via Paystack (Ref: ${payment.gatewayReference})`,
              status: TransactionStatus.SUCCESSFUL,
            },
          });
        }
      }
    }

    return updatedPayment;
  });
}
