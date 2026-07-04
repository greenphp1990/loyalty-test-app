require('dotenv').config();

async function run() {
  try {
    console.log("Fetching GET http://localhost:3000/api/v1/debug/brevo-whatsapp");
    const response = await fetch("http://localhost:3000/api/v1/debug/brevo-whatsapp");
    const status = response.status;
    const body = await response.json().catch(() => ({}));
    console.log("Status:", status);
    console.log("Body:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

run();
