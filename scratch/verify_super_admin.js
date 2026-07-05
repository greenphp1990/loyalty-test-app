const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("🔍 Querying admin@ngojobsite.com database status...");
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@ngojobsite.com" },
      include: { wallet: true }
    });

    if (user) {
      console.log("✅ User Found!");
      console.log("Email:", user.email);
      console.log("Role:", user.role);
      console.log("Status:", user.status);
      console.log("Password Hash:", user.passwordHash);
      console.log("Wallet Status:", user.wallet ? "Provisioned" : "Missing");
      console.log("Wallet Balance:", user.wallet ? user.wallet.balance : "N/A");
    } else {
      console.log("❌ User admin@ngojobsite.com NOT found in database.");
    }
  } catch (error) {
    console.error("Query failed with error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
