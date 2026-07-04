import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { TestStatus, GiftStatus, PaymentStatus, GiftType } from "@prisma/client";
import { classifyQuestion, validateAndNormalizeNigerianPhone, normalizeText } from "@/lib/matcher";
import { encrypt } from "@/lib/crypto";
import crypto from "crypto";

// GET all tests created by the sender
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    const tests = await prisma.loyaltyTest.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tests }, { status: 200 });

  } catch (error) {
    console.error("❌ Get sender tests error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}

// POST create a new loyalty test (saves as awaiting payment)
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    
    const { 
      receiverName, 
      receiverPhone, 
      optionalMessage, 
      questionType, 
      questionText, 
      expectedAnswer, 
      giftType, 
      giftAmount, 
      expiresHours = 24 
    } = body;

    // 1. Basic validation
    if (!receiverName || !receiverPhone || !questionText || !expectedAnswer || !giftType || !giftAmount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 2. Validate and Normalize Nigerian Phone Number
    const normalizedPhone = validateAndNormalizeNigerianPhone(phoneNumberValidationClean(receiverPhone));
    if (!normalizedPhone) {
      return NextResponse.json({ 
        error: "Invalid Nigerian phone number. Please enter a valid 10/11-digit Nigerian number." 
      }, { status: 400 });
    }

    // Enforce Anti-Harassment Quotas
    // Quota 1: Max 5 tests per sender per day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dailyCount = await prisma.loyaltyTest.count({
      where: {
        senderId: userId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (process.env.NODE_ENV !== "development" && dailyCount >= 5) {
      return NextResponse.json({ 
        error: "Daily safety quota reached. Senders are restricted to a maximum of 5 tests per day." 
      }, { status: 400 });
    }

    // Quota 2: Max 2 tests for the same receiver phone number by any sender per week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyReceiverCount = await prisma.loyaltyTest.count({
      where: {
        receiverPhone: normalizedPhone,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    if (process.env.NODE_ENV !== "development" && weeklyReceiverCount >= 2) {
      return NextResponse.json({ 
        error: "Weekly limit exceeded. This receiver number has already been tested the maximum of 2 times in the last 7 days." 
      }, { status: 400 });
    }

    // Respect min/max gift amount
    const minSetting = await prisma.platformSetting.findUnique({ where: { key: "minimum_gift_amount" } });
    const maxSetting = await prisma.platformSetting.findUnique({ where: { key: "maximum_gift_amount" } });
    const minGift = minSetting ? Number(minSetting.value) : 100;
    const maxGift = maxSetting ? Number(maxSetting.value) : 50000;

    if (giftAmount < minGift || giftAmount > maxGift) {
      return NextResponse.json({ 
        error: `Gift amount must be between ₦${minGift.toLocaleString()} and ₦${maxGift.toLocaleString()}.` 
      }, { status: 400 });
    }

    // 3. Check Blocked Numbers list
    const isBlocked = await prisma.blockedNumber.findUnique({
      where: { phoneNumber: normalizedPhone },
    });
    if (process.env.NODE_ENV !== "development" && isBlocked) {
      return NextResponse.json({ 
        error: "This receiver number has opted out of relationship verification testing." 
      }, { status: 400 });
    }

    // 4. Question Safety checks (Phishing prevention)
    if (questionType === "CUSTOM") {
      // Check feature flag for custom questions
      const customQuestionsFlag = await prisma.featureFlag.findUnique({
        where: { featureName: "custom_questions" },
      });
      if (customQuestionsFlag && !customQuestionsFlag.enabled) {
        return NextResponse.json({ error: "Custom questions are disabled by the administrator." }, { status: 400 });
      }

      const activeKeywords = await prisma.blockedKeyword.findMany({
        where: { status: "ACTIVE" },
      });
      
      const safetyResult = classifyQuestion(questionText, activeKeywords);
      
      if (safetyResult.classification !== "safe") {
        // Log the blocked attempt in database
        await prisma.blockedQuestionAttempt.create({
          data: {
            userId,
            questionText,
            reason: safetyResult.reason || "Suspicious question pattern",
            classification: safetyResult.classification.toUpperCase(),
          },
        });

        return NextResponse.json({ 
          error: `Question blocked by safety engine: ${safetyResult.reason || "Suspicious request."}` 
        }, { status: 400 });
      }
    }

    // If template, check if template is enabled
    if (questionType === "TEMPLATE") {
      const templateExists = await prisma.questionTemplate.findFirst({
        where: { questionText, status: "ACTIVE" },
      });
      if (!templateExists) {
        return NextResponse.json({ error: "Selected question template is inactive or invalid." }, { status: 400 });
      }
    }

    // 5. Calculate pricing costs
    const feeSetting = await prisma.platformSetting.findUnique({ where: { key: "basic_test_fee" } });
    const serviceFee = feeSetting ? Number(feeSetting.value) : 500;
    const totalAmount = giftAmount + serviceFee;

    // 6. Create Loyalty Test link (Saved as awaiting payment)
    const testToken = crypto.randomBytes(6).toString("hex"); // 12-char unique link token
    const encryptedAnswer = encrypt(expectedAnswer);
    const normalizedAnswer = normalizeText(expectedAnswer);
    const expiryDate = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

    const newTest = await prisma.loyaltyTest.create({
      data: {
        senderId: userId,
        receiverName,
        receiverPhone: normalizedPhone,
        optionalMessage,
        questionType,
        questionText,
        expectedAnswerEncrypted: encryptedAnswer,
        expectedAnswerNormalized: normalizedAnswer,
        testToken,
        giftType: giftType.toUpperCase() as GiftType,
        giftAmount,
        serviceFee,
        totalAmount,
        paymentStatus: PaymentStatus.PENDING,
        testStatus: TestStatus.ACTIVE,
        giftStatus: GiftStatus.PENDING,
        expiresAt: expiryDate,
      },
    });

    return NextResponse.json({
      message: "Loyalty test saved as awaiting payment.",
      testId: newTest.id,
      testToken: newTest.testToken,
      totalAmount,
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Create loyalty test error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// Clean phone inputs to allow normal formatting validation
function phoneNumberValidationClean(phone: string): string {
  if (!phone) return "";
  let clean = phone.trim().replace(/\s+/g, "");
  return clean;
}
