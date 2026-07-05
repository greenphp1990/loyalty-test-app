const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
  const email = `testuser_${randomSuffix}@example.com`;
  const phoneNumber = `0801${randomSuffix}`;
  const fullName = `Test Wallet User ${randomSuffix}`;

  console.log(`🚀 Registering user: ${email} (${phoneNumber})...`);

  try {
    const res = await fetch("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phoneNumber,
        password: "SecretPassword123"
      })
    });

    const status = res.status;
    const body = await res.json().catch(() => ({}));

    console.log("Status:", status);
    console.log("Response:", JSON.stringify(body, null, 2));

    if (status === 201 && body.user && body.user.id) {
      console.log(`\n🔍 Fetching created wallet & transaction logs for User: ${body.user.id}`);
      
      const wallet = await prisma.wallet.findUnique({
        where: { userId: body.user.id }
      });
      console.log("Wallet:", JSON.stringify(wallet, null, 2));

      const txs = await prisma.walletTransaction.findMany({
        where: { userId: body.user.id }
      });
      console.log("Transactions:", JSON.stringify(txs, null, 2));
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
