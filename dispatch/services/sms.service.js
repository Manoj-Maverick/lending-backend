import twilio from "twilio";
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const ACCOUNT_TOKEN = process.env.ACCOUNT_TOKEN;
const PHONE_NUMBER = process.env.PHONE_NUMBER;

const client = twilio(ACCOUNT_SID, ACCOUNT_TOKEN);

export async function sendSMS(to, message) {
  try {
    const res = await client.messages.create({
      body: message,
      from: PHONE_NUMBER,
      to,
    });

    console.log("✅ SMS sent:", res.sid);
  } catch (err) {
    console.error("❌ SMS failed:", err.message);
  }
}
