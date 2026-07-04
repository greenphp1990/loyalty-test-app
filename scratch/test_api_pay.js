const { SignJWT } = require('jose');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "default-fallback-secure-secret-key-32-chars";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "auth-token";

async function signJWT(payload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

async function testPayApi() {
  const userId = "523ba992-7c53-4f1e-98b3-87a8433ef574";
  const email = "test@example.com";
  const role = "SENDER";
  const status = "ACTIVE";

  const token = await signJWT({ userId, email, role, status });
  console.log("Generated Token:", token);

  const testId = "3f5c3c20-a13d-4408-8411-b8ebfafd1c1c";
  const url = `http://localhost:3000/api/v1/sender/tests/${testId}/pay`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${COOKIE_NAME}=${token}`
      },
      body: JSON.stringify({ gateway: "WALLET" })
    });

    console.log("Response Status:", res.status);
    console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
    
    const text = await res.text();
    console.log("Response Body Length:", text.length);
    console.log("Response Body (first 500 chars):", text.slice(0, 500));
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

testPayApi();
