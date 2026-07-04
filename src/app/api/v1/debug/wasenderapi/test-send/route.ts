import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWasenderApiTextMessage, normalizeWhatsAppPhoneE164 } from "@/lib/messaging/wasenderapi";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { to } = body;

    if (!to) {
      return NextResponse.json({ error: "recipient phone 'to' is required." }, { status: 400 });
    }

    // Accept only one phone number. Reject arrays, comma-separated, space-separated.
    if (typeof to !== "string" || Array.isArray(to)) {
      return NextResponse.json({ error: "Recipient must be a single phone number string. Arrays are not supported." }, { status: 400 });
    }

    const trimmed = to.trim();
    if (/[\s,;\n\r]/.test(trimmed)) {
      return NextResponse.json({ error: "Multiple phone numbers, arrays, or comma-separated recipients are not supported." }, { status: 400 });
    }

    const normalizedRecipient = normalizeWhatsAppPhoneE164(to);
    const text = "Test message from Loyalty Test app via WasenderAPI.";

    // Send using WasenderAPI helper
    const result = await sendWasenderApiTextMessage({
      to: normalizedRecipient,
      text,
    });

    // Write log to database
    try {
      await prisma.messageLog.create({
        data: {
          channel: "WHATSAPP",
          provider: "wasenderapi",
          recipientPhone: normalizedRecipient,
          status: result.success ? "SUCCESSFUL" : "FAILED",
          providerStatus: result.providerStatus ? String(result.providerStatus) : (result.success ? "SUCCESS" : "FAILED"),
          providerMessageId: result.providerMessageId ? String(result.providerMessageId) : null,
          errorCode: result.stage,
          errorMessage: result.error || null,
          requestPayload: {
            to: normalizedRecipient,
            text,
          },
          responsePayload: result.responsePayload || result.debug?.providerResponse || null,
        },
      });
    } catch (logError) {
      console.error("[MessageLog Error] Could not write message log to database:", logError);
    }

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      channel: result.channel,
      stage: result.stage,
      error: result.error,
      debug: result.debug,
      providerMessageId: result.providerMessageId,
      providerStatus: result.providerStatus,
      jid: result.jid,
    }, { status: result.debug?.httpStatus || (result.success ? 200 : 400) });

  } catch (err: any) {
    console.error("[Test Send Error] Exception in test-send handler:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
