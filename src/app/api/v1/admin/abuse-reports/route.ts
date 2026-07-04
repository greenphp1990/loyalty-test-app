import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, GiftStatus, ReportStatus, RewardStatus, TransactionType, TransactionStatus } from "@prisma/client";
import crypto from "crypto";

function detectNetwork(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (/^(?:234|0)(?:803|806|703|706|903|906|813|814|816|913|916)/.test(clean)) return "MTN";
  if (/^(?:234|0)(?:802|808|701|708|812|902|907|901|912)/.test(clean)) return "AIRTEL";
  if (/^(?:234|0)(?:805|807|705|815|905|915)/.test(clean)) return "GLO";
  return "9MOBILE";
}

// GET all abuse reports
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminRoles = ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN"];
    if (!adminRoles.includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.abuseReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        test: {
          include: {
            sender: {
              select: {
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ reports }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin GET abuse reports error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// PATCH resolve or dismiss abuse report
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminRoles = ["SUPER_ADMIN", "SUPPORT_ADMIN"];
    if (!adminRoles.includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, action, resolution } = body; // action = "RESOLVE" | "DISMISS", resolution = "RELEASE" | "REFUND"

    if (!reportId || !action) {
      return NextResponse.json({ error: "Missing reportId or action." }, { status: 400 });
    }

    const report = await prisma.abuseReport.findUnique({
      where: { id: reportId },
      include: { test: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Abuse report not found." }, { status: 404 });
    }

    if (report.status !== ReportStatus.PENDING) {
      return NextResponse.json({ error: "Abuse report has already been reviewed." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (action === "RESOLVE") {
        // Mark report as resolved
        await tx.abuseReport.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.RESOLVED,
            reviewedBy: session.userId,
          },
        });

        if (resolution === "RELEASE") {
          // Release: Update test status and trigger reward creation
          await tx.loyaltyTest.update({
            where: { id: report.testId },
            data: {
              testStatus: TestStatus.COMPLETED,
              giftStatus: GiftStatus.RELEASED,
            },
          });

          const detectedNetwork = detectNetwork(report.test.receiverPhone);
          await tx.reward.create({
            data: {
              testId: report.testId,
              senderId: report.test.senderId,
              receiverPhone: report.test.receiverPhone,
              rewardType: report.test.giftType,
              network: detectedNetwork,
              amount: report.test.giftAmount,
              provider: "MOCK",
              providerReference: `MOCK-REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
              status: RewardStatus.SUCCESSFUL,
              deliveredAt: new Date(),
            },
          });

        } else if (resolution === "REFUND") {
          // Refund: Update test status, refund sender wallet, record transaction ledger log
          await tx.loyaltyTest.update({
            where: { id: report.testId },
            data: {
              testStatus: TestStatus.DECLINED,
              giftStatus: GiftStatus.REFUNDED,
            },
          });

          const wallet = await tx.wallet.findUnique({
            where: { userId: report.test.senderId },
          });

          if (wallet) {
            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  increment: report.test.giftAmount,
                },
              },
            });

            const refundRef = `TX-REFUND-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId: report.test.senderId,
                transactionType: TransactionType.REFUND,
                amount: report.test.giftAmount,
                balanceBefore: wallet.balance,
                balanceAfter: updatedWallet.balance,
                reference: refundRef,
                description: `Admin escrow refund of ₦${report.test.giftAmount.toLocaleString()} following resolved abuse report ID ${report.id}`,
                status: TransactionStatus.SUCCESSFUL,
              },
            });
          }
        } else {
          throw new Error("Invalid resolution type for resolved abuse report.");
        }

        await tx.adminAuditLog.create({
          data: {
            adminId: session.userId,
            action: "RESOLVE_ABUSE_REPORT",
            entityType: "ABUSE_REPORT",
            entityId: reportId,
            metadata: {
              resolution,
              testId: report.testId,
            },
          },
        });

      } else if (action === "DISMISS") {
        // Dismiss report: Unfreeze loyalty test and mark report as dismissed
        await tx.abuseReport.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.DISMISSED,
            reviewedBy: session.userId,
          },
        });

        // Unfreeze test status back to ACTIVE and giftStatus to ESCROW
        await tx.loyaltyTest.update({
          where: { id: report.testId },
          data: {
            testStatus: TestStatus.ACTIVE,
            giftStatus: GiftStatus.ESCROW,
          },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: session.userId,
            action: "DISMISS_ABUSE_REPORT",
            entityType: "ABUSE_REPORT",
            entityId: reportId,
            metadata: {
              testId: report.testId,
            },
          },
        });
      } else {
        throw new Error("Invalid action parameter.");
      }
    });

    return NextResponse.json({
      message: `Abuse report successfully ${action.toLowerCase()}ed.`,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Admin PATCH abuse reports error:", error);
    return NextResponse.json({ error: error.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
