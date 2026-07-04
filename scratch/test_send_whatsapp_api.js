const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function signJWT(payload) {
  const jose = await import('jose');
  const JWT_SECRET = process.env.JWT_SECRET || "default-fallback-secure-secret-key-32-chars";
  const key = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

async function run() {
  try {
    const testId = "66b09346-11a0-4ea9-8bb6-7710c3e78ac2";
    
    // 1. Reset reminderSentAt to null
    await prisma.loyaltyTest.update({
      where: { id: testId },
      data: { reminderSentAt: null }
    });
    console.log("1. Reset reminderSentAt to null for test:", testId);

    // 2. Generate Auth Token
    const payload = {
      userId: "523ba992-7c53-4f1e-98b3-87a8433ef574",
      email: "babiplanet@gmail.com",
      role: "SENDER",
      status: "ACTIVE"
    };
    const token = await signJWT(payload);
    console.log("2. Generated session auth-token:", token);

    // 3. Send POST request to dev server
    console.log("3. Sending POST request to http://localhost:3000/api/v1/sender/tests/66b09346-11a0-4ea9-8bb6-7710c3e78ac2/send-message");
    const response = await fetch(`http://localhost:3000/api/v1/sender/tests/${testId}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
      },
      body: JSON.stringify({ channel: 'WHATSAPP' })
    });

    const status = response.status;
    const body = await response.json().catch(() => ({}));
    console.log("Response Status:", status);
    console.log("Response Body:", JSON.stringify(body, null, 2));

  } catch (error) {
    console.error("Error running test:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
