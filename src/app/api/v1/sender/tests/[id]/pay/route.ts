import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, GiftStatus, PaymentStatus, TransactionType, TransactionStatus, PaymentType } from "@prisma/client";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: testId } = await context.params;
    const userId = session.userId;
    const body = await request.json().catch(() => ({}));
    const { gateway = "WALLET" } = body;

    // 1. Fetch test
    const test = await prisma.loyaltyTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
    }

    if (test.senderId !== userId) {
      return NextResponse.json({ error: "Unauthorized to access this test link." }, { status: 403 });
    }

    if (test.paymentStatus === PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({ error: "This loyalty test is already funded." }, { status: 400 });
    }

    const totalAmount = test.totalAmount;

    // 2. Fund using Wallet Balance
    if (gateway === "WALLET") {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < totalAmount) {
        return NextResponse.json({ 
          error: `Insufficient wallet balance. You need at least ₦${totalAmount.toLocaleString()} to fund this test. Please fund your wallet first.` 
        }, { status: 400 });
      }

      // Execute transaction for wallet balance deduction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: totalAmount,
            },
          },
        });

        // Record charge transaction
        const txRef = `TX-CHARGE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            transactionType: TransactionType.CHARGE,
            amount: totalAmount,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            reference: txRef,
            description: `Funded loyalty test link to ${test.receiverName} via Wallet Balance`,
            status: TransactionStatus.SUCCESSFUL,
          },
        });

        // Record payment ledger
        const gateRef = `WALLET-PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        const payment = await tx.payment.create({
          data: {
            userId,
            testId: test.id,
            paymentType: PaymentType.TEST_FUNDING,
            gateway: "WALLET",
            gatewayReference: gateRef,
            amount: totalAmount,
            currency: "NGN",
            status: PaymentStatus.SUCCESSFUL,
            paidAt: new Date(),
          },
        });

        // Update test statuses
        const updatedTest = await tx.loyaltyTest.update({
          where: { id: test.id },
          data: {
            paymentStatus: PaymentStatus.SUCCESSFUL,
            giftStatus: GiftStatus.ESCROW,
          },
        });

        return { updatedTest, payment };
      });

      return NextResponse.json({
        message: "Escrow funded successfully using Wallet Balance!",
        testToken: result.updatedTest.testToken,
        paymentReference: result.payment.gatewayReference,
      }, { status: 200 });
    }

    // 3. Fund using mock checkout (Paystack)
    if (gateway === "PAYSTACK") {
      const result = await prisma.$transaction(async (tx) => {
        // Record payment ledger (Mocking verified payment webhook)
        const gateRef = `PAYSTACK-PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        const payment = await tx.payment.create({
          data: {
            userId,
            testId: test.id,
            paymentType: PaymentType.TEST_FUNDING,
            gateway: "PAYSTACK",
            gatewayReference: gateRef,
            amount: totalAmount,
            currency: "NGN",
            status: PaymentStatus.SUCCESSFUL,
            paidAt: new Date(),
          },
        });

        // Update test statuses
        const updatedTest = await tx.loyaltyTest.update({
          where: { id: test.id },
          data: {
            paymentStatus: PaymentStatus.SUCCESSFUL,
            giftStatus: GiftStatus.ESCROW,
          },
        });

        return { updatedTest, payment };
      });

      return NextResponse.json({
        message: "Escrow funded successfully via Paystack!",
        testToken: result.updatedTest.testToken,
        paymentReference: result.payment.gatewayReference,
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid payment gateway." }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Fund loyalty test error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
