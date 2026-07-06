import { sendBulkSmsNigeriaSms } from "./messaging/bulksmsnigeria";
import { sendBrevoWhatsAppMessage } from "./messaging/brevo-whatsapp";
import { sendWasenderApiTextMessage } from "./messaging/wasenderapi";

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  providerMessageId?: string | number;
  providerStatus?: string;
  jid?: string;
  error?: string;
  message?: string;
  provider: string;
  channel: string;
  stage: string;
  debug?: any;
}

export async function sendSMS(
  to: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = (process.env.SMS_PROVIDER || "mock").toLowerCase();
  const apiKey = process.env.SMS_API_KEY || "";
  const senderId = process.env.SMS_SENDER_ID || "LOYALTYTEST";

  console.log(`[SMS SENDING] Provider: ${provider}, SenderID: ${senderId}, To: ${to}`);

  if (provider === "bulksmsnigeria") {
    try {
      const data = await sendBulkSmsNigeriaSms({
        to,
        body: message,
        from: senderId,
      });
      return { 
        success: true, 
        messageId: data.data?.message_id || data.message_id || `bulksmsnigeria-${Math.random().toString(36).substring(2, 11).toUpperCase()}` 
      };
    } catch (err: any) {
      console.error("BulkSMSNigeria send error:", err);
      return { success: false, error: err.message || "Connection error." };
    }
  }

  // Fallback to mock if using placeholders or set to mock
  if (provider === "mock" || !apiKey || apiKey.includes("your-sms") || apiKey.includes("xxxxxx")) {
    console.log(`[MOCK SMS] Simulation Success. Message text: "${message}"`);
    return { success: true, messageId: `mock-sms-${Math.random().toString(36).substring(2, 11).toUpperCase()}` };
  }

  if (provider === "termii") {
    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          from: senderId,
          sms: message,
          type: "plain",
          channel: "generic",
          api_key: apiKey,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.message === "Successfully Sent" || data.status === "success")) {
        return { success: true, messageId: data.message_id };
      }
      return { success: false, error: data.message || "Failed to send via Termii API." };
    } catch (err: any) {
      console.error("Termii send error:", err);
      return { success: false, error: err.message || "Connection error." };
    }
  }

  if (provider === "twilio") {
    // If Twilio: assume SMS_API_KEY is formatted as SID:TOKEN
    const [sid, token] = apiKey.split(":");
    if (!sid || !token) {
      console.warn("⚠️ Twilio credentials format mismatch. Expected SMS_API_KEY to be 'ACCOUNT_SID:AUTH_TOKEN'");
      return { success: false, error: "Invalid Twilio credentials format in SMS_API_KEY." };
    }

    try {
      const basicAuth = Buffer.from(`${sid}:${token}`).toString("base64");
      // Fallback from Twilio number configuration or default sandbox sender
      const from = process.env.SMS_SENDER_ID || "+1234567890"; 
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: message,
        }),
      });

      const data = await response.json();
      if (response.ok && !data.error_code) {
        return { success: true, messageId: data.sid };
      }
      return { success: false, error: data.message || "Failed to send via Twilio API." };
    } catch (err: any) {
      console.error("Twilio send error:", err);
      return { success: false, error: err.message || "Connection error." };
    }
  }

  // Fallback to mock for local testing
  console.log(`[SMS SENDING] Unrecognized provider "${provider}". Defaulting to mock success.`);
  return { success: true, messageId: `mock-fallback-${Math.random().toString(36).substring(2, 11).toUpperCase()}` };
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\+/g, "").replace(/\s+/g, "");
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export async function sendWhatsApp(
  to: string,
  testLink: string,
  customMessage?: string
): Promise<SendWhatsAppResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || "mock").toLowerCase();

  console.log(`[WHATSAPP SENDING] Provider: ${provider}, To: ${to}, Link: ${testLink}`);

  if (provider === "wasenderapi") {
    const text = customMessage || `🎁 You have a secured relationship gift waiting.

Open your private link below to respond safely:

${testLink}

🔒 Safety Notice:
Do not enter passwords, OTPs, bank details, card details, BVN, NIN, or private account information.

⏳ This private link may expire soon.`;

    const res = await sendWasenderApiTextMessage({ to, text });
    return {
      success: res.success,
      provider: "wasenderapi",
      channel: "WHATSAPP",
      stage: res.stage,
      providerMessageId: res.providerMessageId,
      providerStatus: res.providerStatus,
      jid: res.jid,
      error: res.error,
      debug: res.debug,
      messageId: res.providerMessageId ? String(res.providerMessageId) : undefined,
    };
  }

  if (provider === "brevo") {
    const res = await sendBrevoWhatsAppMessage({
      to,
      params: {
        "1": testLink
      }
    });
    return {
      success: res.success,
      provider: "brevo",
      channel: "WHATSAPP",
      stage: res.stage,
      providerMessageId: res.messageId,
      error: res.error,
      debug: res.debug,
      messageId: res.messageId,
    };
  }

  // Fallback/Default to mock
  if (provider === "mock") {
    console.log(`[MOCK WHATSAPP] Simulation Success. Receiver: ${to}, Param1: ${testLink}`);
    return {
      success: true,
      messageId: `mock-wa-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      provider: "mock",
      channel: "WHATSAPP",
      stage: "MOCK_SEND_SUCCESS",
    };
  }

  // Extendable for other providers in the future (e.g. meta, sendchamp, 360dialog)

  console.log(`[WHATSAPP SENDING] Unrecognized provider "${provider}". Defaulting to mock success.`);
  return {
    success: true,
    messageId: `mock-fallback-wa-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
    provider: "mock-fallback",
    channel: "WHATSAPP",
    stage: "MOCK_FALLBACK_SEND_SUCCESS",
  };
}

