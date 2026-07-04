import { NextResponse } from "next/server";
import { getWasenderApiSessionStatus } from "@/lib/messaging/wasenderapi";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.WASENDER_API_KEY;
  const baseUrl = process.env.WASENDER_API_BASE_URL || "https://www.wasenderapi.com";
  const whatsappProvider = process.env.WHATSAPP_PROVIDER || "mock";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const hasApiKey = !!apiKey;
  const hasBaseUrl = !!baseUrl;
  const hasAppUrl = !!appUrl;

  let sessionStatus = "disconnected";
  let rawSessionResponse = null;

  if (hasApiKey) {
    try {
      const res = await getWasenderApiSessionStatus();
      rawSessionResponse = res;
      sessionStatus = res.status || res.data?.status || (res.success && res.data ? "connected" : "disconnected");
    } catch (err: any) {
      sessionStatus = `error: ${err.message || err}`;
    }
  }

  const ok = hasApiKey && hasBaseUrl && hasAppUrl && (whatsappProvider === "wasenderapi" || whatsappProvider === "mock");

  return NextResponse.json({
    ok,
    provider: "wasenderapi",
    config: {
      hasApiKey,
      baseUrl,
      whatsappProvider,
      appUrl,
    },
    session: {
      status: sessionStatus,
      raw: (process.env.NODE_ENV as string) !== "production" ? rawSessionResponse : undefined
    }
  }, { status: 200 });
}
