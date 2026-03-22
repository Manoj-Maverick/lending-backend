import connection from "../queue/connection.js";
import { generateOTP } from "../utils/otp.js";
import { sendSMS } from "./sms.service.js";

const OTP_EXPIRY = 300; // 5 minutes
const COOLDOWN = 30; // 30 seconds
const MAX_ATTEMPTS = 3;

// 📱 Normalize phone (ensure +91 format)
function formatPhone(phone) {
  console.log(phone, typeof phone);
  if (!String(phone).startsWith("+")) {
    return `+91${phone}`;
  }
  return phone;
}

// =======================
// SEND OTP
// =======================
export async function sendOTP(phone, test = true) {
  const formattedPhone = formatPhone(phone);

  const otp = generateOTP();

  const otpKey = `otp:phone:${formattedPhone}`;
  const cooldownKey = `otp_cooldown:${formattedPhone}`;

  // ⛔ Cooldown check
  const cooldown = await connection.get(cooldownKey);
  if (cooldown) {
    throw new Error("OTP recently sent. Please wait.");
  }

  // 💾 Store OTP
  await connection.set(otpKey, otp, "EX", OTP_EXPIRY);
  await connection.set(cooldownKey, "1", "EX", COOLDOWN);

  // 📩 Send SMS
  try {
    if (test) {
      console.log(`your otp for ${formattedPhone} : ${otp}`);
    } else {
      await sendSMS(
        formattedPhone,
        `🔐 Your OTP is ${otp}. Valid for 5 minutes.`,
      );
    }
  } catch (err) {
    console.error("❌ SMS failed:", err.message);
    throw new Error("Failed to send OTP");
  }

  console.log(`✅ OTP sent to ${formattedPhone}`);

  // ⚠️ Do NOT return OTP in production
  return { success: true };
}

// =======================
// VERIFY OTP
// =======================
export async function verifyOTP(phone, otp) {
  const formattedPhone = formatPhone(phone);

  const otpKey = `otp:phone:${formattedPhone}`;
  const attemptKey = `otp_attempts:${formattedPhone}`;

  const stored = await connection.get(otpKey);

  //  Expired
  if (!stored) {
    throw new Error("OTP expired");
  }

  // Wrong OTP
  if (stored !== String(otp)) {
    const attempts = await connection.incr(attemptKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await connection.expire(attemptKey, OTP_EXPIRY);
    }

    // Too many attempts
    if (attempts >= MAX_ATTEMPTS) {
      await connection.del(otpKey);
      await connection.del(attemptKey);
      throw new Error("Too many attempts. OTP blocked.");
    }

    throw new Error(`Invalid OTP (${attempts}/${MAX_ATTEMPTS})`);
  }

  // ✅ Success
  await connection.del(otpKey);
  await connection.del(attemptKey);

  return { success: true };
}
