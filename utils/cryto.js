import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.KYC_SECRET || "dev_secret_key")
  .digest();

export function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(data) {
  if (!data) return null;

  const [ivHex, encryptedText] = data.split(":");

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function last4(text) {
  if (!text) return null;
  return text.slice(-4);
}

export function mask(text) {
  if (!text) return null;

  const visible = text.slice(-4);
  return "XXXXXXXX" + visible;
}
