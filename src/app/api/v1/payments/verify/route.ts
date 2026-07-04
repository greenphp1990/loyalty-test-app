import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { handlePaymentSuccess } from "@/lib/payments";
import { PaymentStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required." }, { status: 400 });
    }

    // Fetch the payment details
    const payment = await prisma.payment.findUnique({
      where: { gatewayReference: reference },
      include: {
        test: {
          select: {
            testToken: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment transaction not found." }, { status: 404 });
    }

    // Check if the user is authorized to view this transaction
    if (payment.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized access to this transaction." }, { status: 403 });
    }

    // If already successful, return immediately
    if (payment.status === PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({
        status: "success",
        paymentStatus: payment.status,
        amount: payment.amount,
        testToken: payment.test?.testToken || null,
        message: "Payment verified successfully.",
      });
    }

    const isMockMode =
      !process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY.includes("xxxxxxxx") ||
      process.env.PAYSTACK_SECRET_KEY === "placeholder" ||
      process.env.PAYSTACK_SECRET_KEY.startsWith("mock_");

    if (isMockMode) {
      // Simulate successful payment verify in mock mode
      await handlePaymentSuccess(payment.id);

      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          test: {
            select: {
              testToken: true,
            },
          },
        },
      });

      return NextResponse.json({
        status: "success",
        paymentStatus: updatedPayment?.status || PaymentStatus.SUCCESSFUL,
        amount: updatedPayment?.amount || payment.amount,
        testToken: updatedPayment?.test?.testToken || null,
        message: "Payment verified successfully (Mock Mode).",
      });
    }

    // Real Paystack verification API check
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();
    
    if (verifyRes.ok && verifyData.status && verifyData.data.status === "success") {
      // Execute the success flow atomically
      await handlePaymentSuccess(payment.id);

      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          test: {
            select: {
              testToken: true,
            },
          },
        },
      });

      return NextResponse.json({
        status: "success",
        paymentStatus: updatedPayment?.status || PaymentStatus.SUCCESSFUL,
        amount: updatedPayment?.amount || payment.amount,
        testToken: updatedPayment?.test?.testToken || null,
        message: "Payment verified successfully.",
      });
    }

    // Payment not successful yet (could be pending or failed)
    return NextResponse.json({
      status: "pending",
      paymentStatus: payment.status,
      amount: payment.amount,
      testToken: null,
      message: verifyData.message || "Payment is awaiting completion.",
    });

  } catch (error: any) {
    console.error("❌ Verify payment error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
