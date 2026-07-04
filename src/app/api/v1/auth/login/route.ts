import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signJWT, setSessionCookie } from "@/lib/auth";
import { UserStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 2. Fetch user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return ambiguous error to prevent account enumeration
      return NextResponse.json({ error: "Invalid email address or password" }, { status: 400 });
    }

    // 3. Verify password
    const isPasswordMatch = await comparePassword(password, user.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: "Invalid email address or password" }, { status: 400 });
    }

    // 4. Check status
    if (user.status !== UserStatus.ACTIVE) {
      if (user.status === UserStatus.SUSPENDED) {
        return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
      }
      return NextResponse.json({ error: "Your account has been banned due to terms violations." }, { status: 403 });
    }

    // 5. Sign session token and set cookie
    const sessionToken = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    await setSessionCookie(sessionToken);

    // 6. Return user details
    return NextResponse.json({
      message: "Login successful!",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        referralCode: user.referralCode,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Login error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
