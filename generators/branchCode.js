import pool from "../db.js";

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

  // District code (first 3 letters)
  const districtCode = district
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);

  // Area code (remove vowels for nicer abbreviations)
  const areaCode = area
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/[AEIOU]/g, "")
    .slice(0, 3);

  const prefix = `${typeCode}-${districtCode}${areaCode}`;

  const result = await pool.query(
    `
    SELECT branch_code
    FROM branches
    WHERE branch_code LIKE $1
    ORDER BY branch_code DESC
    LIMIT 1
    `,
    [`${prefix}%`],
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastCode = result.rows[0].branch_code;

    const lastSeq = parseInt(lastCode.slice(-3), 10);

    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  const seq = String(nextNumber).padStart(3, "0");

  return `${prefix}${seq}`;
}
