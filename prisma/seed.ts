import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, UserStatus, GiftType, KeywordSeverity, KeywordStatus, TemplateStatus, ContentStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database!");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Default Super Admin User
  const adminEmail = "admin@loyaltytest.app";
  const adminPhone = "08000000000";
  const defaultPassword = "AdminPassword123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log(`👤 Upserting default Super Admin: ${adminEmail}`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      fullName: "Super Admin",
      email: adminEmail,
      phoneNumber: adminPhone,
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      referralCode: "SUPERADMIN1",
    },
  });

  // Ensure Admin has a wallet
  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      balance: 100000.0, // Seed with some sandbox platform credit
      currency: "NGN",
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Seed Default Feature Flags
  const featureFlags = [
    { name: "airtime_gifts", enabled: true },
    { name: "data_gifts", enabled: true },
    { name: "cash_gifts", enabled: false }, // Optional and disabled by default
    { name: "mystery_gifts", enabled: true },
    { name: "wallet", enabled: true },
    { name: "withdrawals", enabled: true },
    { name: "referrals", enabled: true },
    { name: "custom_questions", enabled: true },
    { name: "premium_tests", enabled: true },
    { name: "multi_question_tests", enabled: true },
    { name: "sms_sending", enabled: false }, // Enabled later in Phase 4
    { name: "whatsapp_sending", enabled: true },
    { name: "push_notifications", enabled: false },
    { name: "reminders", enabled: true },
    { name: "receiver_report_button", enabled: true },
    { name: "receiver_block_button", enabled: true },
  ];

  console.log("🚩 Seeding feature flags...");
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { featureName: flag.name },
      update: {},
      create: {
        featureName: flag.name,
        enabled: flag.enabled,
        updatedBy: adminUser.id,
      },
    });
  }

  // 3. Seed Default Pricing & Config Settings
  const pricingSettings = [
    { key: "basic_test_fee", value: "500", desc: "Service fee for Basic Loyalty Test (1 question)" },
    { key: "premium_test_fee", value: "1000", desc: "Service fee for Premium Loyalty Test (2-3 questions)" },
    { key: "sms_fee", value: "15", desc: "Cost per reminder SMS sent" },
    { key: "whatsapp_fee", value: "0", desc: "Cost per reminder WhatsApp message (free generated links)" },
    { key: "gift_processing_fee", value: "0", desc: "Percentage or flat charge on processing locked gifts" },
    { key: "cash_payout_fee", value: "100", desc: "Flat fee in NGN for bank cash withdrawals" },
    { key: "minimum_gift_amount", value: "100", desc: "Minimum locked gift value in NGN" },
    { key: "maximum_gift_amount", value: "50000", desc: "Maximum locked gift value in NGN" },
    { key: "minimum_wallet_balance", value: "0", desc: "Minimum balance to keep wallet active" },
    { key: "withdrawal_fee", value: "100", desc: "Flat withdrawal processing fee" },
    { key: "referral_commission", value: "50", desc: "Payout in NGN to referrer per paid test created" },
    { key: "refund_rules", value: "wallet_refund", desc: "Default failure policy: wallet_refund or payment_method" },
  ];

  console.log("⚙️ Seeding pricing & system settings...");
  for (const setting of pricingSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.desc,
        updatedBy: adminUser.id,
      },
    });
  }

  // 4. Seed Safe Question Templates
  const questionTemplates = [
    // Partner Identity
    { category: "PARTNER_IDENTITY", text: "What is the name of your boyfriend?", type: "TEXT" },
    { category: "PARTNER_IDENTITY", text: "What is the name of your girlfriend?", type: "TEXT" },
    { category: "PARTNER_IDENTITY", text: "What is the name of your husband?", type: "TEXT" },
    { category: "PARTNER_IDENTITY", text: "What is the name of your wife?", type: "TEXT" },
    { category: "PARTNER_IDENTITY", text: "What is the name of the person you are in a relationship with?", type: "TEXT" },
    
    // Relationship Memory
    { category: "RELATIONSHIP_MEMORY", text: "What nickname does your partner call you?", type: "TEXT" },
    { category: "RELATIONSHIP_MEMORY", text: "What month is your partner's birthday?", type: "TEXT" },
    { category: "RELATIONSHIP_MEMORY", text: "What is your partner's favorite color?", type: "TEXT" },
    { category: "RELATIONSHIP_MEMORY", text: "Where did you first meet your partner?", type: "TEXT" },
    { category: "RELATIONSHIP_MEMORY", text: "What is your partner's middle name?", type: "TEXT" },
    
    // Light Personal Questions
    { category: "LIGHT_PERSONAL", text: "What is your partner's favorite food?", type: "TEXT" },
    { category: "LIGHT_PERSONAL", text: "What is your partner's favorite football club?", type: "TEXT" },
    { category: "LIGHT_PERSONAL", text: "What is your partner's favorite nickname?", type: "TEXT" },
    { category: "LIGHT_PERSONAL", text: "What special name do you call your partner?", type: "TEXT" },
  ];

  console.log("❓ Seeding safe question templates...");
  for (const q of questionTemplates) {
    // Check if template already exists to avoid duplicates
    const exists = await prisma.questionTemplate.findFirst({
      where: { questionText: q.text }
    });
    if (!exists) {
      await prisma.questionTemplate.create({
        data: {
          category: q.category,
          questionText: q.text,
          answerType: q.type,
          status: TemplateStatus.ACTIVE,
        }
      });
    }
  }

  // 5. Seed Blocked sensitive keywords
  const blockedKeywords = [
    { word: "password", severity: KeywordSeverity.HIGH },
    { word: "passcode", severity: KeywordSeverity.HIGH },
    { word: "otp", severity: KeywordSeverity.HIGH },
    { word: "pin", severity: KeywordSeverity.HIGH },
    { word: "bvn", severity: KeywordSeverity.HIGH },
    { word: "nin", severity: KeywordSeverity.HIGH },
    { word: "cvv", severity: KeywordSeverity.HIGH },
    { word: "card number", severity: KeywordSeverity.HIGH },
    { word: "account number", severity: KeywordSeverity.HIGH },
    { word: "bank login", severity: KeywordSeverity.HIGH },
    { word: "atm", severity: KeywordSeverity.HIGH },
    { word: "address", severity: KeywordSeverity.MEDIUM },
    { word: "location", severity: KeywordSeverity.MEDIUM },
    { word: "private picture", severity: KeywordSeverity.HIGH },
    { word: "nude", severity: KeywordSeverity.HIGH },
    { word: "token", severity: KeywordSeverity.HIGH },
    { word: "verification code", severity: KeywordSeverity.HIGH },
  ];

  console.log("🚫 Seeding safety engine blocked keywords...");
  for (const kw of blockedKeywords) {
    await prisma.blockedKeyword.upsert({
      where: { keyword: kw.word },
      update: {},
      create: {
        keyword: kw.word,
        severity: kw.severity,
        status: KeywordStatus.ACTIVE,
      },
    });
  }

  // 6. Seed default Terms/Privacy CMS pages
  const contentPages = [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: "Loyalty Test values data minimization. We only collect details that are essential... Expected answers are encrypted in storage..."
    },
    {
      slug: "terms-conditions",
      title: "Terms and Conditions",
      content: "We strictly prohibit utilizing the service for harassment, public shaming, blackmail, spying, or stalking..."
    }
  ];

  console.log("📄 Seeding legal content CMS pages...");
  for (const page of contentPages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        content: page.content,
        status: ContentStatus.PUBLISHED,
      }
    });
  }

  console.log("🎉 Database seeding completed successfully!");
  console.log("--------------------------------------------------");
  console.log("🔑 Default Credentials:");
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${defaultPassword}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
