import { sendOTP, verifyOTP } from "../../dispatch/services/otp.service.js";

export async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    await sendOTP(Number(phone));

    res.json({
      success: true,
      message: "OTP sent",
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    await verifyOTP(Number(phone), Number(otp));

    res.json({
      success: true,
      message: "Phone verified",
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
}
