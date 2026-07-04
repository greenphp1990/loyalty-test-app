import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminRoles = ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN"];
    if (!adminRoles.includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (enabled === undefined) {
      return NextResponse.json({ error: "Missing enabled state." }, { status: 400 });
    }

    const flag = await prisma.featureFlag.update({
      where: { featureName: "custom_questions" },
      data: {
        enabled: Boolean(enabled),
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({
      message: `Custom questions feature flag updated to ${flag.enabled ? "ON" : "OFF"}.`,
      flag,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin PATCH custom questions flag error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
