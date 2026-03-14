import connection from "../queue/connection.js";
import { generateOTP } from "../utils/otp.js";
const OTP_EXPIRY = 300; // 5 minutes
const MAX_ATTEMPTS = 3;

export async function sendOTP(phone) {
  const otp = generateOTP();

  const otpKey = `otp:phone:${phone}`;
  const cooldownKey = `otp_cooldown:${phone}`;

  const cooldown = await connection.get(cooldownKey);

  if (cooldown) {
    throw new Error("OTP recently sent. Please wait.");
  }

  await connection.set(otpKey, otp, "EX", OTP_EXPIRY);
  await connection.set(cooldownKey, "1", "EX", 30);

  console.log(`OTP for ${phone}: ${otp}`);

  return otp;
}

export async function verifyOTP(phone, otp) {
  const otpKey = `otp:phone:${phone}`;
  const attemptKey = `otp_attempts:${phone}`;

  const stored = Number(await connection.get(otpKey));

  if (!stored) {
    throw new Error("OTP expired");
  }

  if (stored !== otp) {
    const attempts = await connection.incr(attemptKey);

    if (attempts === 1) {
      await connection.expire(attemptKey, 300);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await connection.del(otpKey);
      throw new Error("Too many attempts");
    }

    throw new Error("Invalid OTP");
  }

  await connection.del(otpKey);
  await connection.del(attemptKey);

  return true;
}
