import { getNextSequence } from "./nextSequence.js";

export async function generateCustomerCode(branchCode) {
  // branchCode example: HD-CUDPNR001
  console.log(branchCode, typeof branchCode);
  const cityArea = branchCode.split("-")[1].slice(0, 6);

  const year = new Date().getFullYear();

  const key = `CUSTOMER_${cityArea}_${year}`;

  const seq = await getNextSequence(key);
  const seqStr = String(seq).padStart(4, "0");

  return `${cityArea}${year}${seqStr}`;
}
