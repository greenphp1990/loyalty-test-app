import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET all feature flags
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

    const flags = await prisma.featureFlag.findMany({
      orderBy: { featureName: "asc" },
    });

    return NextResponse.json({ flags }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin GET feature flags error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// PATCH toggle a feature flag
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can modify feature flags
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { featureName, enabled } = body;

    if (!featureName || enabled === undefined) {
      return NextResponse.json({ error: "Missing featureName or enabled status." }, { status: 400 });
    }

    const existingFlag = await prisma.featureFlag.findUnique({
      where: { featureName },
    });

    if (!existingFlag) {
      return NextResponse.json({ error: "Feature flag not found." }, { status: 404 });
    }

    const updatedFlag = await prisma.$transaction(async (tx) => {
      const flag = await tx.featureFlag.update({
        where: { featureName },
        data: {
          enabled: Boolean(enabled),
          updatedBy: session.userId,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: session.userId,
          action: "TOGGLE_FEATURE_FLAG",
          entityType: "FEATURE_FLAG",
          entityId: featureName,
          metadata: {
            enabled: Boolean(enabled),
          },
        },
      });

      return flag;
    });

    return NextResponse.json({
      message: `Feature flag "${featureName}" toggled to ${updatedFlag.enabled ? "ON" : "OFF"}.`,
      flag: updatedFlag,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin PATCH feature flags error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
