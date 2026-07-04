import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, ResultStatus, ReferralStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // 1. Fetch test stats
    const totalTests = await prisma.loyaltyTest.count({
      where: { senderId: userId },
    });

    const pendingTests = await prisma.loyaltyTest.count({
      where: { senderId: userId, testStatus: TestStatus.ACTIVE },
    });

    const completedTests = await prisma.loyaltyTest.count({
      where: { senderId: userId, testStatus: TestStatus.COMPLETED },
    });

    const passedTests = await prisma.loyaltyTest.count({
      where: { senderId: userId, resultStatus: ResultStatus.PASSED },
    });

    const failedTests = await prisma.loyaltyTest.count({
      where: { senderId: userId, resultStatus: ResultStatus.FAILED },
    });

    // 2. Fetch wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    const walletBalance = wallet ? wallet.balance : 0.0;

    // 3. Fetch referral earnings (sum of PAID commissions)
    const referrals = await prisma.referral.aggregate({
      where: { referrerId: userId, status: ReferralStatus.PAID },
      _sum: {
        commissionAmount: true,
      },
    });
    const referralEarnings = referrals._sum.commissionAmount || 0.0;

    return NextResponse.json({
      stats: {
        totalTests,
        pendingTests,
        completedTests,
        passedTests,
        failedTests,
        walletBalance,
        referralEarnings,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Get sender stats error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
