import { generateBranchCode } from "../../generators/branchCode.js";
export async function generateNewBranchCode(req, res) {
  const { branchType, district, area } = req.body;

  if (!branchType || !district || !area) {
    return res.status(400).json({
      error: "branchType and city are required",
    });
  }

  try {
    const branchCode = await generateBranchCode(branchType, district, area);

    res.status(200).json({
      branchCode,
    });
  } catch (error) {
    console.error("Branch code generation failed:", error);

    res.status(500).json({
      error: "Failed to generate branch code",
    });
  }
}
