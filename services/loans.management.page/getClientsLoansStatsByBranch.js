import db from "../../db.js";

/**
 * GET /api/loans/stats
 * Query params:
 *  - branch: "all" | branch_id (number)
 *
 * Purpose:
 *  - Returns ONLY aggregated stats for Loan Management dashboard
 *  - NOT affected by search or table filters
 */
export async function getLoansManagementStats(req, res) {
  const { branch = "all" } = req.query;

  const params = [];
  let whereSQL = "";
  let idx = 1;

  // -----------------------------
  // Branch filter (optional)
  // -----------------------------
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

  // -----------------------------
  // Stats query (aggregated KPIs)
  // -----------------------------
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE l.status = 'ACTIVE') AS active_loans,
      COUNT(*) FILTER (WHERE l.status = 'CLOSED') AS closed_loans,
      COUNT(*) FILTER (WHERE l.status = 'FORECLOSED') AS foreclosed_loans,

      COALESCE(SUM(l.total_payable), 0) AS total_disbursed,

      COALESCE(
        SUM(l.total_payable) - COALESCE(SUM(p.paid_amount), 0),
        0
      ) AS total_outstanding

    FROM loans l
    LEFT JOIN payments p ON p.loan_id = l.id
    ${whereSQL};
  `;

  try {
    const { rows } = await db.query(query, params);

    return res.json({
      success: true,
      data: rows[0], // single row of stats
    });
  } catch (err) {
    console.error("Error fetching loan management stats:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan management stats",
    });
  }
}
