import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TemplateStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.questionTemplate.findMany({
      where: { status: TemplateStatus.ACTIVE },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({ templates }, { status: 200 });

  } catch (error) {
    console.error("❌ Get question templates error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
