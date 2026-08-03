export function generateOTP() {
  return 1234 || Math.floor(1000 + Math.random() * 9000).toString();
}
