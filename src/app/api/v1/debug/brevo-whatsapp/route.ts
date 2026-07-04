import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const baseUrl = process.env.BREVO_WHATSAPP_BASE_URL || "https://api.brevo.com/v3";
  const templateId = process.env.BREVO_WHATSAPP_TEMPLATE_ID;
  const senderNumber = process.env.BREVO_WHATSAPP_SENDER_NUMBER;
  const whatsappProvider = process.env.WHATSAPP_PROVIDER || "mock";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const hasApiKey = !!apiKey;
  const hasTemplateId = !!templateId;
  const hasSenderNumber = !!senderNumber;

  // Mask sender number (keep first 3 digits and last 4, middle masked)
  let senderNumberPreview = "";
  if (senderNumber) {
    const cleaned = senderNumber.replace(/\D/g, "");
    if (cleaned.length > 7) {
      senderNumberPreview = cleaned.substring(0, 3) + "*".repeat(cleaned.length - 7) + cleaned.substring(cleaned.length - 4);
    } else {
      senderNumberPreview = cleaned;
    }
  }

  const isTemplateNumeric = templateId ? /^\d+$/.test(templateId) : false;
  const isSenderNumeric = senderNumber ? /^\d+$/.test(senderNumber.replace(/\D/g, "")) : false;

  const configOk = hasApiKey && hasTemplateId && hasSenderNumber && isTemplateNumeric && isSenderNumeric;

  return NextResponse.json({
    ok: configOk,
    provider: "brevo",
    config: {
      hasApiKey,
      hasTemplateId,
      templateId: hasTemplateId ? (isTemplateNumeric ? "present" : "invalid_format") : "missing",
      hasSenderNumber,
      senderNumberPreview,
      baseUrl,
      whatsappProvider,
      appUrl
    }
  }, { status: 200 });
}
