import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user and include wallet
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        wallet: user.wallet ? {
          balance: user.wallet.balance,
          currency: user.wallet.currency,
          status: user.wallet.status,
        } : null,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Get user profile error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
