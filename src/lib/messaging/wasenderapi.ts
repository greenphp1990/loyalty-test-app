export function normalizeWhatsAppPhoneE164(phone: string): string {
  // Strip spaces, dashes, brackets, parentheses
  let clean = phone.replace(/[\s\-\(\)\[\]]/g, "");
  
  if (clean.startsWith("+")) {
    return clean;
  }
  
  if (clean.startsWith("0")) {
    return "+234" + clean.substring(1);
  }
  
  return "+" + clean;
}

export interface WasenderApiSendResult {
  success: boolean;
  provider: "wasenderapi";
  channel: "WHATSAPP";
  stage: string;
  providerMessageId?: string | number;
  providerStatus?: string;
  jid?: string;
  error?: string;
  responsePayload?: any;
  debug?: any;
}

export async function sendWasenderApiTextMessage({
  to,
  text,
}: {
  to: string;
  text: string;
}): Promise<WasenderApiSendResult> {
  const provider = "wasenderapi";
  const channel = "WHATSAPP";
  const timestamp = new Date().toISOString();

  const baseUrl = process.env.WASENDER_API_BASE_URL || "https://www.wasenderapi.com";
  const apiKey = process.env.WASENDER_API_KEY;

  const endpointPath = "/api/send-message";
  const fullUrl = `${baseUrl}${endpointPath}`;

  const buildDebug = (httpStatus?: number, responseBody?: any) => {
    if (process.env.NODE_ENV === "production") return undefined;
    return {
      httpStatus,
      providerResponse: responseBody,
      apiKeyPresent: !!apiKey,
      recipientFormat: typeof to === "string" ? normalizeWhatsAppPhoneE164(to) : String(to),
      endpoint: endpointPath,
    };
  };

  // Reject multiple phone numbers, arrays, or comma-separated numbers
  if (typeof to !== "string" || Array.isArray(to)) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_RECIPIENT_NUMBER",
      error: "Recipient must be a single phone number string. Arrays are not supported.",
      debug: buildDebug(400, "Recipient is not a string/array rejected"),
    };
  }

  const trimmed = to.trim();
  if (/[\s,;\n\r]/.test(trimmed)) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_RECIPIENT_NUMBER",
      error: "Multiple phone numbers, arrays, or comma-separated recipients are not supported.",
      debug: buildDebug(400, "Multiple recipients detected"),
    };
  }

  const normalizedRecipient = normalizeWhatsAppPhoneE164(to);
  const isValidPhone = normalizedRecipient.startsWith("+") &&
    /^\d+$/.test(normalizedRecipient.substring(1)) &&
    normalizedRecipient.substring(1).length >= 10;

  if (!apiKey) {
    return {
      success: false,
      provider,
      channel,
      stage: "WASENDER_API_KEY_MISSING",
      error: "Missing WASENDER_API_KEY environment variable.",
      debug: buildDebug(400, "Missing API Key"),
    };
  }

  if (!isValidPhone) {
    return {
      success: false,
      provider,
      channel,
      stage: "INVALID_RECIPIENT_NUMBER",
      error: `Invalid phone format: "${normalizedRecipient}". Must start with + and contain >= 10 digits.`,
      debug: buildDebug(400, "Invalid phone format"),
    };
  }

  const payload = {
    to: normalizedRecipient,
    text,
  };

  console.log(`[WasenderAPI Request] Provider: ${provider}, Endpoint: ${endpointPath}, Recipient: ${normalizedRecipient}, Timestamp: ${timestamp}`);

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    const responseBody = await response.json().catch(() => ({}));

    // Safe server logging (excluding key)
    console.log(`[WasenderAPI Response] Provider: ${provider}, Endpoint: ${endpointPath}, Recipient: ${normalizedRecipient}, HTTPStatus: ${status}, Success: ${!!responseBody.success}, ProviderStatus: ${responseBody.data?.status || "N/A"}, Body: ${JSON.stringify(responseBody)}, Timestamp: ${new Date().toISOString()}`);

    if (response.ok && responseBody.success === true) {
      return {
        success: true,
        provider,
        channel,
        stage: "WASENDER_API_SEND_SUCCESS",
        providerMessageId: responseBody.data?.msgId,
        providerStatus: responseBody.data?.status,
        jid: responseBody.data?.jid,
        responsePayload: responseBody,
      };
    } else {
      return {
        success: false,
        provider,
        channel,
        stage: "WASENDER_API_SEND_FAILED",
        error: responseBody.message || `WasenderAPI returned status code ${status}`,
        responsePayload: responseBody,
        debug: buildDebug(status, responseBody),
      };
    }
  } catch (error: any) {
    console.error(`[WasenderAPI Exception] Error: ${error.message || error}, Timestamp: ${new Date().toISOString()}`);
    return {
      success: false,
      provider,
      channel,
      stage: "WASENDER_API_SEND_EXCEPTION",
      error: error.message || "Connection exception.",
      debug: buildDebug(500, error.message || "Fetch call failed"),
    };
  }
}

export async function getWasenderApiSessionStatus(): Promise<any> {
  const baseUrl = process.env.WASENDER_API_BASE_URL || "https://www.wasenderapi.com";
  const apiKey = process.env.WASENDER_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Missing API Key" };
  }

  const endpointPath = "/api/status";
  const fullUrl = `${baseUrl}${endpointPath}`;

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    return await response.json().catch(() => ({ success: false, message: `Status code ${response.status}` }));
  } catch (error: any) {
    return { success: false, error: error.message || "Connection failed" };
  }
}
