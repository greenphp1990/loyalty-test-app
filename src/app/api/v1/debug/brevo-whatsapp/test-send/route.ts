import { NextResponse } from "next/server";
  import prisma from "@/lib/prisma";
  import { sendBrevoWhatsAppMessage, normalizeWhatsAppPhone } from "@/lib/messaging/brevo-whatsapp";
  
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
  
      const normalizedRecipient = normalizeWhatsAppPhone(to);
      const templateId = process.env.BREVO_WHATSAPP_TEMPLATE_ID;
      const senderNumber = process.env.BREVO_WHATSAPP_SENDER_NUMBER;
  
      // Dispatch the real Brevo message via helper
      const result = await sendBrevoWhatsAppMessage({
        to: normalizedRecipient,
        // Optional template parameters can be sent without parameters first as requested
      });
  
      // Write log to database
      try {
        await prisma.messageLog.create({
          data: {
            channel: "WHATSAPP",
            provider: "brevo",
            recipientPhone: normalizedRecipient,
            status: result.success ? "SUCCESS" : "FAILED",
            providerStatus: result.debug?.httpStatus ? String(result.debug.httpStatus) : (result.success ? "201" : "FAILED"),
            providerMessageId: result.messageId,
            errorCode: result.stage,
            errorMessage: result.error,
            requestPayload: {
              contactNumbers: [normalizedRecipient],
              templateId: templateId ? Number(templateId) : null,
              senderNumber: senderNumber ? normalizeWhatsAppPhone(senderNumber) : null
            },
            responsePayload: result.debug?.brevoResponse || (result.success ? { success: true, messageId: result.messageId } : { success: false, error: result.error })
          }
        });
      } catch (logError) {
        console.error("[MessageLog Error] Could not write message log to database:", logError);
      }
  
      return NextResponse.json({
        success: result.success,
        provider: result.provider,
        channel: result.channel,
        stage: result.stage,
        message: result.message || (result.success ? "WhatsApp message submitted successfully." : "WhatsApp message could not be sent."),
        error: result.error,
        debug: result.debug
      }, { status: result.debug?.httpStatus || (result.success ? 200 : 400) });
  
    } catch (err: any) {
      console.error("[Test Send Error] Exception in test-send handler:", err);
      return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
  }
