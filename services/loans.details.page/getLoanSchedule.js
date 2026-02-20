import db from "../../db.js";

/**
 * GET /api/loans/:loanId/schedule
 * Returns payment schedule for a loan
 */
export async function getLoanSchedule(req, res) {
  const { loanId } = req.params;

  // Basic validation
  const parsedLoanId = Number(loanId);
  if (!parsedLoanId || isNaN(parsedLoanId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid loanId",
    });
  }

  const query = `
    SELECT
      ls.id,
      ls.installment_no,
      ls.due_date,
      ls.due_amount,
      ls.status,
      ls.fine_amount
    FROM loan_schedule ls
    WHERE ls.loan_id = $1
    ORDER BY ls.installment_no ASC
  `;

  try {
    const { rows } = await db.query(query, [parsedLoanId]);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching loan schedule:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan schedule",
    });
  }
}
