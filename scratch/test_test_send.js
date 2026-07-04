const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkResponse(label, payload) {
  console.log(`\n--- Test: ${label} ---`);
  try {
    const response = await fetch("http://localhost:3000/api/v1/debug/wasenderapi/test-send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const body = await response.json().catch(() => ({}));
    console.log("Status:", status);
    console.log("Body:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("Fetch failed:", error.message || error);
  }
}

async function run() {
  try {
    // 1. Test comma-separated string rejection
    await checkResponse("Comma-Separated String", { to: "07060686313, 08012345678" });

    // 2. Test array rejection
    await checkResponse("Array of Recipients", { to: ["07060686313", "08012345678"] });

    // 3. Test space-separated string rejection
    await checkResponse("Space-Separated String", { to: "07060686313 08012345678" });

    // 4. Test valid single phone number
    await checkResponse("Valid Single Phone Number", { to: "07060686313" });

    // Query MessageLog database
    console.log("\nQuerying latest MessageLog entries...");
    const latestLogs = await prisma.messageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    console.log("DB logs:", JSON.stringify(latestLogs, null, 2));

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
