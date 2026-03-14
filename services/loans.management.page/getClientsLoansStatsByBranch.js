import db from "../../db.js";

/**
 * GET /api/loans/stats
 */
export async function getLoansManagementStats(req, res) {
  const { branch = "all" } = req.query;

  const params = [];
  let whereSQL = "";
  let idx = 1;

  if (branch !== "all") {
    const branchId = Number(branch);

    if (Number.isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch parameter",
      });
    }

    params.push(branchId);
    whereSQL = `WHERE l.branch_id = $${idx++}`;
  }

  const query = `
    SELECT
      COUNT(*) FILTER (WHERE l.status = 'ACTIVE') AS active_loans,
      COUNT(*) FILTER (WHERE l.status = 'CLOSED') AS closed_loans,
      COUNT(*) FILTER (WHERE l.status = 'FORECLOSED') AS foreclosed_loans,

      COALESCE(SUM(l.total_payable),0) AS total_disbursed,

      COALESCE(
        SUM(l.total_payable) - SUM(COALESCE(pay.total_paid,0)),
        0
      ) AS total_outstanding

    FROM loans l

    LEFT JOIN (
      SELECT
        loan_id,
        SUM(paid_amount) AS total_paid
      FROM payments
      GROUP BY loan_id
    ) pay ON pay.loan_id = l.id

    ${whereSQL};
  `;

  try {
    const { rows } = await db.query(query, params);

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("Error fetching loan management stats:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan management stats",
    });
  }
}
