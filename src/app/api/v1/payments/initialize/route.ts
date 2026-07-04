import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PaymentType, PaymentStatus } from "@prisma/client";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const email = session.email;
    const body = await request.json().catch(() => ({}));
    const { paymentType, testId, amount } = body;

    if (!paymentType || (paymentType !== "TEST_FUNDING" && paymentType !== "WALLET_FUNDING")) {
      return NextResponse.json({ error: "Invalid payment type." }, { status: 400 });
    }

    let finalAmount = 0;

    if (paymentType === "TEST_FUNDING") {
      if (!testId) {
        return NextResponse.json({ error: "Test ID is required for test funding." }, { status: 400 });
      }
      const test = await prisma.loyaltyTest.findUnique({
        where: { id: testId },
      });
      if (!test) {
        return NextResponse.json({ error: "Loyalty test not found." }, { status: 404 });
      }
      if (test.senderId !== userId) {
        return NextResponse.json({ error: "Unauthorized access to this test." }, { status: 403 });
      }
      if (test.paymentStatus === PaymentStatus.SUCCESSFUL) {
        return NextResponse.json({ error: "This loyalty test is already funded." }, { status: 400 });
      }
      finalAmount = test.totalAmount;
    } else {
      // WALLET_FUNDING
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "A valid positive funding amount is required." }, { status: 400 });
      }
      finalAmount = amount;
    }

    // Generate a unique reference
    const reference = `PAY-${paymentType === "TEST_FUNDING" ? "TEST" : "WALL"}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Create a pending Payment record
    await prisma.payment.create({
      data: {
        userId,
        testId: paymentType === "TEST_FUNDING" ? testId : null,
        paymentType: paymentType as PaymentType,
        gateway: "PAYSTACK",
        gatewayReference: reference,
        amount: finalAmount,
        currency: "NGN",
        status: PaymentStatus.PENDING,
      },
    });

    const isMockMode =
      !process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY.includes("xxxxxxxx") ||
      process.env.PAYSTACK_SECRET_KEY === "placeholder" ||
      process.env.PAYSTACK_SECRET_KEY.startsWith("mock_");

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (isMockMode) {
      const mockUrl = `${origin}/dashboard/checkout/mock-paystack?reference=${reference}`;
      return NextResponse.json({
        status: true,
        authorizationUrl: mockUrl,
        reference,
      });
    }

    // Call real Paystack Transaction Initialize
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(finalAmount * 100), // convert to kobo
        reference,
        callback_url: `${origin}/dashboard/checkout/verify`,
        metadata: {
          testId: paymentType === "TEST_FUNDING" ? testId : undefined,
          paymentType,
          userId,
        },
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackRes.ok || !paystackData.status) {
      console.error("Paystack Initialize Error:", paystackData);
      return NextResponse.json({
        error: paystackData.message || "Failed to initialize payment with Paystack.",
      }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference,
    });

  } catch (error: any) {
    console.error("❌ Initialize payment error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
