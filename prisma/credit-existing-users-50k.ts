import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserStatus } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
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
  console.log("🚀 Starting existing users ₦50,000 wallet credit backfill...");

  // 1. Fetch all users
  const users = await prisma.user.findMany();
  const totalUsers = users.length;
  console.log(`👤 Found ${totalUsers} total users in the database.`);

  let walletsCreated = 0;
  let usersCredited = 0;
  let usersSkipped = 0;
  let errorsCount = 0;

  for (const user of users) {
    try {
      // Execute each user's credit backfill in a transaction
      await prisma.$transaction(async (tx) => {
        // 1. Get or create wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId: user.id },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: user.id,
              balance: 0.0,
              currency: "NGN",
              status: UserStatus.ACTIVE,
            },
          });
          walletsCreated++;
          console.log(`[Wallet Created] Created a new wallet for user: ${user.fullName} (${user.id})`);
        }

        // 2. Check if user already received welcome credit
        const targetReference = `WELCOME_50000_BONUS_${user.id}`;
        const existingTx = await tx.walletTransaction.findUnique({
          where: { reference: targetReference },
        });

        if (existingTx) {
          usersSkipped++;
          console.log(`[Skipped] User ${user.fullName} (${user.id}) already received the welcome bonus.`);
          return;
        }

        const bonusAmount = 50000;
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + bonusAmount;

        // 3. Update wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: balanceAfter,
          },
        });

        // 4. Create WalletTransaction log
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            transactionType: "DEPOSIT",
            amount: bonusAmount,
            balanceBefore,
            balanceAfter,
            reference: targetReference,
            description: "₦50,000 welcome test credit",
            status: "SUCCESSFUL",
          },
        });

        usersCredited++;
        console.log(`[Credited] Credited ₦${bonusAmount.toLocaleString()} to user ${user.fullName} (${user.id}). Balance: ${balanceBefore} -> ${balanceAfter}`);
      });
    } catch (err: any) {
      errorsCount++;
      console.error(`❌ Error crediting user ${user.fullName} (${user.id}):`, err.message || err);
    }
  }

  console.log("\n🏁 Backfill Execution Summary:");
  console.log(`-----------------------------------`);
  console.log(`📊 Total Users Found : ${totalUsers}`);
  console.log(`👛 Wallets Created   : ${walletsCreated}`);
  console.log(`💰 Users Credited   : ${usersCredited}`);
  console.log(`⏭️  Users Skipped    : ${usersSkipped}`);
  console.log(`❌ Errors Encountered: ${errorsCount}`);
  console.log(`-----------------------------------`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
