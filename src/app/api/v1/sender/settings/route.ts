import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch relevant feature flags
    const flags = await prisma.featureFlag.findMany({
      where: {
        featureName: {
          in: ["airtime_gifts", "data_gifts", "cash_gifts", "custom_questions", "whatsapp_sending", "sms_sending"]
        }
      }
    });

    // Convert flags to key-value map
    const featureFlagsMap = flags.reduce((acc, flag) => {
      acc[flag.featureName] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    // 2. Fetch platform settings
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: ["minimum_gift_amount", "maximum_gift_amount", "basic_test_fee"]
        }
      }
    });

    // Convert settings to key-value map
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      featureFlags: {
        airtimeGifts: featureFlagsMap["airtime_gifts"] ?? true,
        dataGifts: featureFlagsMap["data_gifts"] ?? true,
        cashGifts: featureFlagsMap["cash_gifts"] ?? false,
        customQuestions: featureFlagsMap["custom_questions"] ?? true,
        whatsappSending: featureFlagsMap["whatsapp_sending"] ?? true,
        smsSending: featureFlagsMap["sms_sending"] ?? false,
      },
      settings: {
        minimumGiftAmount: Number(settingsMap["minimum_gift_amount"] || 100),
        maximumGiftAmount: Number(settingsMap["maximum_gift_amount"] || 50000),
        basicTestFee: Number(settingsMap["basic_test_fee"] || 500),
      },
      messagingConfig: {
        whatsappProvider: process.env.WHATSAPP_PROVIDER || "mock",
        whatsappConfigured: !!process.env.WASENDER_API_KEY || (process.env.WHATSAPP_PROVIDER === "mock"),
        smsProvider: process.env.SMS_PROVIDER || "mock",
        smsConfigured: !!process.env.BULKSMS_NIGERIA_API_TOKEN || (process.env.SMS_PROVIDER === "mock")
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Get sender settings error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
