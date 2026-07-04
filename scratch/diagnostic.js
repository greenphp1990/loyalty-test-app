const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const test = await prisma.loyaltyTest.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Diagnostic success! Latest test ID:', test ? test.id : 'None');
    if (test) {
      console.log('Payment status:', test.paymentStatus);
      console.log('Gift status:', test.giftStatus);
      const wallet = await prisma.wallet.findUnique({
        where: { userId: test.senderId }
      });
      console.log('Sender wallet balance:', wallet ? wallet.balance : 'No wallet');
    }
  } catch (e) {
    console.error('Diagnostic Prisma error:', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}
check();
