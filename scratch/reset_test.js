const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function reset() {
  try {
    const testId = "3f5c3c20-a13d-4408-8411-b8ebfafd1c1c";
    
    // Reset test
    const test = await prisma.loyaltyTest.update({
      where: { id: testId },
      data: {
        paymentStatus: "PENDING",
        giftStatus: "PENDING"
      }
    });
    console.log("Reset test:", test.id, "paymentStatus:", test.paymentStatus);

    // Reset wallet balance
    const wallet = await prisma.wallet.update({
      where: { userId: test.senderId },
      data: {
        balance: 50000
      }
    });
    console.log("Reset wallet balance to:", wallet.balance);

    // Delete created payment records for this test
    const deletedPayments = await prisma.payment.deleteMany({
      where: { testId }
    });
    console.log("Deleted payment records count:", deletedPayments.count);

    // Delete created wallet transactions for this test
    const deletedTx = await prisma.walletTransaction.deleteMany({
      where: { userId: test.senderId, transactionType: "CHARGE" }
    });
    console.log("Deleted transactions count:", deletedTx.count);

  } catch (error) {
    console.error("Error during reset:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

reset();
