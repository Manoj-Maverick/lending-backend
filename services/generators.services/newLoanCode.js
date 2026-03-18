import { generateLoanCode } from "../../generators/loanCode.js";

export async function generateNewLoanCode(req, res) {
  const { customerCode } = req.body;

  if (!customerCode) {
    return res.status(400).json({
      error: "customer code is required",
    });
  }

  try {
    const loanCode = await generateLoanCode(customerCode);

    res.status(200).json({
      loanCode,
    });
  } catch (error) {
    console.error("loan code generation failed:", error);

    res.status(500).json({
      error: "Failed to generate loan code",
    });
  }
}
