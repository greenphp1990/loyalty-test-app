import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    const rewards = await prisma.reward.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        test: {
          select: {
            receiverName: true,
          },
        },
      },
    });

    return NextResponse.json({ rewards }, { status: 200 });

  } catch (error) {
    console.error("❌ Get sender rewards error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
