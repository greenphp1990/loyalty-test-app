import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ Error: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@ngojobsite.com";
  const plainPassword = "08076170834";
  const phoneNumber = "08076170834";

  console.log(`🚀 Starting Super Admin creation/update for: ${email}`);

  // Hash password using bcryptjs (salt rounds = 10 as in seed.ts)
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let user;
    if (existingUser) {
      // Update password, role, and status
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`[Update] Updated existing user settings for ${email}.`);
    } else {
      // Create a new user
      user = await prisma.user.create({
        data: {
          fullName: "Super Admin NGOJobsite",
          email,
          phoneNumber,
          passwordHash: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          referralCode: "NGOJOBSITE1",
        },
      });
      console.log(`[Create] Created new user account for ${email}.`);
    }

    // 2. Ensure user has a wallet
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!existingWallet) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 100000.0, // Seed with sandbox credit
          currency: "NGN",
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`[Wallet] Provisioned active wallet for ${email}.`);
    } else {
      console.log(`[Wallet] User ${email} already has an active wallet.`);
    }

    console.log("🎉 Super Admin created/updated successfully: admin@ngojobsite.com");
  } catch (err: any) {
    console.error("❌ Failed to create/update Super Admin:", err.message || err);
  }
}

main()
  .catch((e) => {
    console.error("❌ Script exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
