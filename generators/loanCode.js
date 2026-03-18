import { getNextSequence } from "./nextSequence.js";

export async function generateLoanCode(customerCode) {
  const key = `LOAN_${customerCode}`;

  const seq = await getNextSequence(key);

  const seqStr = String(seq).padStart(2, "0");

  return `${customerCode}-L${seqStr}`;
}
