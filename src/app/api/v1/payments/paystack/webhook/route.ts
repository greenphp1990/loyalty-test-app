import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { handlePaymentSuccess } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-paystack-signature");
    const rawBody = await request.text();

    const isMockMode =
      !process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY.includes("xxxxxxxx") ||
      process.env.PAYSTACK_SECRET_KEY === "placeholder" ||
      process.env.PAYSTACK_SECRET_KEY.startsWith("mock_");

    let isSignatureValid = false;
    if (signature) {
      const secretKey = isMockMode ? "mock_secret" : process.env.PAYSTACK_SECRET_KEY || "";
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");
      if (hash === signature) {
        isSignatureValid = true;
      }
    }

    // Support local sandbox/mock webhook trigger headers
    if (!isSignatureValid && isMockMode && request.headers.get("x-mock-signature") === "super-secret-mock-token") {
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      console.warn("⚠️ Invalid signature on Paystack webhook request");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    // We only listen for successful charges
    if (event !== "charge.success") {
      return NextResponse.json({ message: "Webhook event ignored" }, { status: 200 });
    }

    const { reference, amount } = payload.data;

    // Look up pending payment record
    const payment = await prisma.payment.findUnique({
      where: { gatewayReference: reference },
    });

    if (!payment) {
      console.error(`❌ Webhook error: Payment record for reference ${reference} not found`);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Verify amount matches (Paystack is in kobo, database is in NGN)
    const eventAmountNGN = amount / 100;
    if (Math.abs(payment.amount - eventAmountNGN) > 0.01) {
      console.error(`❌ Webhook error: Amount mismatch for ref ${reference}. Expected ${payment.amount}, got ${eventAmountNGN}`);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Handle success side-effects atomically via our helper
    await handlePaymentSuccess(payment.id);

    return NextResponse.json({ status: "success", message: "Webhook processed successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Paystack Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
