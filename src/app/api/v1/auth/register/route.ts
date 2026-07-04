import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signJWT, setSessionCookie } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";

// Input Validation helper
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^(?:\+234|0)[789][01]\d{8}$/.test(phone);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, password, referralCode } = body;

    // 1. Basic validation
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Invalid name (minimum 2 characters)" }, { status: 400 });
    }
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      return NextResponse.json({ error: "Invalid Nigerian phone number format (e.g. 08012345678)" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Normalize phone number (ensure local format or standard formatting)
    const normalizedPhone = phoneNumber.trim().replace(/\s+/g, "");

    // 2. Check duplicates
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { phoneNumber: normalizedPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return NextResponse.json({ error: "Email address is already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: "Phone number is already registered" }, { status: 400 });
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Generate unique referral code for the new user
    const prefix = fullName.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "LT");
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newReferralCode = `${prefix}-${suffix}`;

    // 5. Database transaction: Create User & linked Wallet
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phoneNumber: normalizedPhone,
          passwordHash: hashedPassword,
          role: UserRole.SENDER,
          status: UserStatus.ACTIVE,
          referralCode: newReferralCode,
          referredBy: referralCode ? referralCode.trim() : null,
        },
      });

      // Automatically create the wallet
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
          currency: "NGN",
          status: UserStatus.ACTIVE,
        },
      });

      return { user, wallet };
    });

    // 6. Sign session token and set cookie
    const sessionToken = await signJWT({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
    });

    await setSessionCookie(sessionToken);

    // 7. Return user info
    return NextResponse.json({
      message: "Registration successful!",
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
        referralCode: result.user.referralCode,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Registration error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
