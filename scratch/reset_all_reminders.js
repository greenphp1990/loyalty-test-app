const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetAllReminders() {
  try {
    const result = await prisma.loyaltyTest.updateMany({
      data: {
        reminderSentAt: null
      }
    });
    console.log(`Successfully reset reminder limit for ${result.count} test(s) in the database.`);
  } catch (error) {
    console.error("Error resetting reminders:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

resetAllReminders();
