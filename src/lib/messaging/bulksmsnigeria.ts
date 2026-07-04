export function normalizeNigerianPhone(phone: string): string {
  let clean = phone.replace(/\s+/g, "").replace(/\+/g, "");
  if (clean.startsWith("0")) {
    clean = "234" + clean.substring(1);
  }
  return clean;
}

export async function sendBulkSmsNigeriaSms({
  to,
  body,
  from,
  callbackUrl
}: {
  to: string;
  body: string;
  from?: string;
  callbackUrl?: string;
}): Promise<any> {
  const baseUrl = process.env.BULKSMS_NIGERIA_BASE_URL || "https://www.bulksmsnigeria.com/api/sandbox/v2";
  const apiToken = process.env.BULKSMS_NIGERIA_API_TOKEN;
  const defaultSenderId = process.env.BULKSMS_NIGERIA_SENDER_ID || "LOYALTY";
  const gateway = process.env.BULKSMS_NIGERIA_GATEWAY || "direct-refund";
  const appendSender = process.env.BULKSMS_NIGERIA_APPEND_SENDER || "hosted";

  if (!apiToken) {
    throw new Error("BulkSMSNigeria API token is missing in configuration.");
  }

  const normalizedPhone = normalizeNigerianPhone(to);
  const senderId = (from || defaultSenderId).substring(0, 11);

  const payload: any = {
    from: senderId,
    to: normalizedPhone,
    body,
    api_token: apiToken,
    gateway,
    append_sender: appendSender,
  };

  const finalCallbackUrl = callbackUrl || process.env.BULKSMS_NIGERIA_CALLBACK_URL;
  if (finalCallbackUrl) {
    payload.callback_url = finalCallbackUrl;
  }

  console.log(`[BulkSMSNigeria] Sending SMS to: ${normalizedPhone}, sender ID: ${senderId}`);

  try {
    const response = await fetch(`${baseUrl}/sms`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseStatus = response.status;
    const data = await response.json().catch(() => ({}));

    console.log(`[BulkSMSNigeria] Response status: ${responseStatus}`);

    if (!response.ok) {
      throw new Error(data.message || `API error with status ${responseStatus}`);
    }

    if (data.status === "error" || data.status === "fail" || data.success === false) {
      const errorMsg = data.error?.message || data.message || "BulkSMSNigeria failed to dispatch message.";
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    console.error("❌ BulkSMSNigeria SMS sending failed:", error.message || error);
    throw new Error(error.message || "BulkSMSNigeria SMS service unavailable.");
  }
}
