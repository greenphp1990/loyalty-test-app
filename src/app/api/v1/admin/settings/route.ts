import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET all platform settings
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

    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ settings }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin GET settings error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// PATCH update a platform setting
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Restrict pricing edits to SUPER_ADMIN and FINANCE_ADMIN
    const allowedRoles = ["SUPER_ADMIN", "FINANCE_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing setting key or value." }, { status: 400 });
    }

    const existingSetting = await prisma.platformSetting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      return NextResponse.json({ error: "Setting not found." }, { status: 404 });
    }

    const oldValue = existingSetting.value;
    const newValue = String(value).trim();

    // Perform setting update and audit logging atomically
    const updatedSetting = await prisma.$transaction(async (tx) => {
      const setting = await tx.platformSetting.update({
        where: { key },
        data: {
          value: newValue,
          updatedBy: session.userId,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: session.userId,
          action: "UPDATE_SETTING",
          entityType: "PLATFORM_SETTING",
          entityId: key,
          metadata: {
            oldValue,
            newValue,
          },
        },
      });

      return setting;
    });

    return NextResponse.json({
      message: `Setting "${key}" updated successfully.`,
      setting: updatedSetting,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin PATCH settings error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
