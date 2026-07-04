export function normalizeWhatsAppPhone(phone: string): string {
  // Strip all spaces, plus signs, dashes, brackets, parentheses
  let clean = phone.replace(/[\s\+\-\(\)\[\]]/g, "");
  if (clean.startsWith("0")) {
    clean = "234" + clean.substring(1);
  }
  return clean;
}

interface SendWhatsAppMessageParams {
  to: string;
  templateId?: number | string;
  senderNumber?: string;
  params?: Record<string, string>;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
  provider: string;
  channel: string;
  stage: string;
  debug?: {
    httpStatus?: number;
    brevoResponse?: any;
    templateIdPresent: boolean;
    senderNumberPresent: boolean;
    recipientNumberPresent: boolean;
    recipientFormat: string;
    endpoint: string;
  };
}

export async function sendBrevoWhatsAppMessage({
  to,
  templateId,
  senderNumber,
  params,
}: SendWhatsAppMessageParams): Promise<SendWhatsAppResult> {
  const provider = "brevo";
  const channel = "WHATSAPP";
  const timestamp = new Date().toISOString();
  
  const apiKey = process.env.BREVO_API_KEY;
  const baseUrl = process.env.BREVO_WHATSAPP_BASE_URL || "https://api.brevo.com/v3";
  const envTemplateId = process.env.BREVO_WHATSAPP_TEMPLATE_ID;
  const envSenderNumber = process.env.BREVO_WHATSAPP_SENDER_NUMBER;

  const finalTemplateId = templateId || envTemplateId;
  const finalSender = senderNumber || envSenderNumber;

  const templateIdPresent = !!finalTemplateId;
  const senderNumberPresent = !!finalSender;
  const recipientNumberPresent = !!to;
  
  const normalizedRecipient = to ? normalizeWhatsAppPhone(to) : "";
  const normalizedSender = finalSender ? normalizeWhatsAppPhone(finalSender) : "";
  
  const isRecipientNumeric = /^\d+$/.test(normalizedRecipient);
  const isSenderNumeric = /^\d+$/.test(normalizedSender);
  const isTemplateNumeric = finalTemplateId ? /^\d+$/.test(String(finalTemplateId)) : false;

  const endpointPath = "/whatsapp/sendMessage";
  const fullUrl = `${baseUrl}${endpointPath}`;

  // Helper to build the debug object
  const buildDebug = (httpStatus?: number, brevoResponse?: any) => {
    if (process.env.NODE_ENV === "production") return undefined;
    return {
      httpStatus,
      brevoResponse,
      templateIdPresent,
      senderNumberPresent,
      recipientNumberPresent,
      recipientFormat: normalizedRecipient,
      endpoint: endpointPath,
    };
  };

  // Validate parameters before sending
  if (!apiKey) {
    return {
      success: false,
      provider,
      channel,
      stage: "BREVO_API_KEY_MISSING",
      message: "WhatsApp message could not be sent. Check provider debug details on the server.",
      error: "Missing BREVO_API_KEY environment variable.",
      debug: buildDebug(400, "Missing API Key"),
    };
  }

  if (!recipientNumberPresent || !isRecipientNumeric) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_RECIPIENT_NUMBER",
      message: "WhatsApp message could not be sent. Check provider debug details on the server.",
      error: `Invalid or missing recipient number: "${normalizedRecipient}". Must be numeric only.`,
      debug: buildDebug(400, "Invalid recipient format"),
    };
  }

  if (!senderNumberPresent || !isSenderNumeric) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_SENDER_NUMBER",
      message: "WhatsApp message could not be sent. Check provider debug details on the server.",
      error: `Invalid or missing sender number: "${normalizedSender}". Must be numeric only.`,
      debug: buildDebug(400, "Invalid sender format"),
    };
  }

  if (!templateIdPresent || !isTemplateNumeric) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_TEMPLATE_ID",
      message: "WhatsApp message could not be sent. Check provider debug details on the server.",
      error: `Invalid or missing template ID: "${finalTemplateId}". Must be numeric only.`,
      debug: buildDebug(400, "Invalid template ID"),
    };
  }

  const numericTemplateId = Number(finalTemplateId);
  const payload: Record<string, any> = {
    contactNumbers: [normalizedRecipient],
    templateId: numericTemplateId,
    senderNumber: normalizedSender,
  };

  if (params && Object.keys(params).length > 0) {
    payload.params = params;
  }

  const receiverUrl = params ? Object.values(params).find(val => typeof val === 'string' && val.startsWith('http')) || "N/A" : "N/A";

  console.log(`[Brevo WhatsApp Request] Provider: ${provider}, Endpoint: ${endpointPath}, Recipient: ${normalizedRecipient}, Sender: ${normalizedSender}, TemplateID: ${numericTemplateId}, Link: ${receiverUrl}, Timestamp: ${timestamp}`);

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    const data = await response.json().catch(() => ({}));

    // Server-only logging without exposing secrets
    console.log(`[Brevo WhatsApp Response] Status: ${status}, Body: ${JSON.stringify(data)}, Timestamp: ${new Date().toISOString()}`);

    if (status === 201) {
      return {
        success: true,
        messageId: data.messageId || `brevo-wa-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        provider,
        channel,
        stage: "BREVO_API_SEND_SUCCESS",
      };
    } else {
      return {
        success: false,
        provider,
        channel,
        stage: "BREVO_API_SEND_FAILED",
        message: "WhatsApp message could not be sent. Check provider debug details on the server.",
        error: data.message || `Brevo returned status code ${status}`,
        debug: buildDebug(status, data),
      };
    }
  } catch (error: any) {
    console.error(`[Brevo WhatsApp Exception] Error: ${error.message || error}, Timestamp: ${new Date().toISOString()}`);
    return {
      success: false,
      provider,
      channel,
      stage: "BREVO_API_SEND_EXCEPTION",
      message: "WhatsApp message could not be sent. Check provider debug details on the server.",
      error: error.message || "Connection exception.",
      debug: buildDebug(500, error.message || "Fetch call failed"),
    };
  }
}
