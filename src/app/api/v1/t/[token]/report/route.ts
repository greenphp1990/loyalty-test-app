import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TestStatus, GiftStatus, ReportStatus, UserRole, UserStatus } from "@prisma/client";
import { sendSMS } from "@/lib/messaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const { reason, comment } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Please provide a reason for the report." }, { status: 400 });
    }

    // 1. Find the test
    const test = await prisma.loyaltyTest.findUnique({
      where: { testToken: token },
    });

    if (!test) {
      return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
    }

    if (test.testStatus !== TestStatus.ACTIVE) {
      return NextResponse.json({ error: `This test has already been ${test.testStatus.toLowerCase()}.` }, { status: 400 });
    }

    // 2. Perform atomic reporting transaction
    await prisma.$transaction(async (tx) => {
      // Update test status to REPORTED and freeze gift
      await tx.loyaltyTest.update({
        where: { id: test.id },
        data: {
          testStatus: TestStatus.REPORTED,
          giftStatus: GiftStatus.FROZEN,
        },
      });

      // Log the abuse report
      await tx.abuseReport.create({
        data: {
          testId: test.id,
          receiverPhone: test.receiverPhone,
          reason: reason.trim(),
          comment: comment ? comment.trim() : null,
          status: ReportStatus.PENDING,
        },
      });
    });

    // Notify admin asynchronously outside transaction block
    prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE },
    }).then((adminUser) => {
      if (adminUser && adminUser.phoneNumber) {
        const smsMessage = `⚠️ [ALERT] Loyalty test ID ${test.id} has been reported for abuse by receiver ${test.receiverPhone}. Reason: ${reason.trim()}. Escrow funds are frozen.`;
        sendSMS(adminUser.phoneNumber, smsMessage).catch((err) => {
          console.error("❌ Failed to send abuse report SMS to admin:", err);
        });
      }
    }).catch((err) => {
      console.error("❌ Failed to fetch admin user for notification:", err);
    });

    return NextResponse.json({ message: "Abuse report logged. The test link has been flagged and frozen." }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Report receiver test error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
