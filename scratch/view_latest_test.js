const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const testId = "66b09346-11a0-4ea9-8bb6-7710c3e78ac2";
    const test = await prisma.loyaltyTest.findUnique({
      where: { id: testId }
    });
    console.log("Latest test details:", JSON.stringify(test, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
