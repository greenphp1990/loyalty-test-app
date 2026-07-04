import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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

    // 1. Total Senders count
    const totalSenders = await prisma.user.count({
      where: { role: UserRole.SENDER },
    });

    // 2. Platform Revenue (sum of serviceFee on successful loyalty tests)
    const revenueAgg = await prisma.loyaltyTest.aggregate({
      _sum: {
        serviceFee: true,
      },
      where: {
        paymentStatus: "SUCCESSFUL",
      },
    });
    const platformRevenue = revenueAgg._sum.serviceFee || 0;

    // 3. Active Escrows (sum of giftAmount on successful tests in ESCROW status)
    const escrowAgg = await prisma.loyaltyTest.aggregate({
      _sum: {
        giftAmount: true,
      },
      where: {
        paymentStatus: "SUCCESSFUL",
        giftStatus: "ESCROW",
      },
    });
    const activeEscrows = escrowAgg._sum.giftAmount || 0;

    // 4. Abuse Flagged count (pending reports)
    const abuseFlagged = await prisma.abuseReport.count({
      where: { status: "PENDING" },
    });

    // 5. Recent Admin Audit Logs
    const recentAuditLogs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        admin: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalSenders,
      platformRevenue,
      activeEscrows,
      abuseFlagged,
      recentAuditLogs,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin GET stats error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
