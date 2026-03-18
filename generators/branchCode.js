import { getNextSequence } from "./nextSequence.js";

export async function generateBranchCode(branchType, district, area) {
  const typeMap = {
    HEAD: "HD",
    MAIN: "MN",
    REGULAR: "RG",
  };

  const typeCode = typeMap[branchType];

  if (!typeCode) {
    throw new Error("Invalid branch type");
  }

  const districtCode = district
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);

  const areaCode = area
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/[AEIOU]/g, "")
    .slice(0, 3);

  const cityArea = `${districtCode}${areaCode}`;

  const key = `BRANCH_${cityArea}`;

  const seq = await getNextSequence(key);

  const seqStr = String(seq).padStart(3, "0");

  return `${typeCode}-${cityArea}${seqStr}`;
}
