import { generateCustomerCode } from "../../generators/customerCode.js";
export async function generateNewCustomerCode(req, res) {
  const { branchCode } = req.body;

  if (!branchCode) {
    return res.status(400).json({
      error: "branh code is required",
    });
  }

  try {
    const customerCode = await generateCustomerCode(branchCode);

    res.status(200).json({
      customerCode,
    });
  } catch (error) {
    console.error("customer code generation failed:", error);

    res.status(500).json({
      error: "Failed to generate customer code",
    });
  }
}
