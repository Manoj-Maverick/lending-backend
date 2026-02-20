// controllers/loans.controller.js
import db from "../../db.js";

/**
 * GET /api/loans/:loanId/details
 * Returns full loan + client + approval info
 */
export async function getLoanProfileInfo(req, res) {
  const { loanId } = req.params;

  if (!loanId || isNaN(loanId)) {
    return res.status(400).json({ success: false, message: "Invalid loan id" });
  }

  const query = `
    SELECT
      l.id,
      l.loan_code,
      b.branch_name,
      l.principal_amount,
      l.total_payable,
      l.interest_rate,
      l.tenure_value,
      l.repayment_type,
      l.tenure_unit,
      l.installment_amount,
      l.sanctioned_date,
      l.start_date,
      l.last_due_date,
      l.status,
      l.processing_fee,
      l.penalty_rate,
      l.closure_reason,

      -- Outstanding = total_payable - paid
      COALESCE(l.total_payable - COALESCE(SUM(p.paid_amount), 0), l.total_payable) AS remaining_balance,

      -- Client
      c.full_name AS client_name,
      c.customer_code,
      c.phone,
      c.email,

      -- Approval
      u.full_name AS approved_by,
      l.approved_at

    FROM loans l
    JOIN customers c ON c.id = l.customer_id
    JOIN branches b ON b.id = l.branch_id
    LEFT JOIN users u ON u.id = l.approved_by
    LEFT JOIN payments p ON p.loan_id = l.id

    WHERE l.id = $1
    GROUP BY
      l.id, b.branch_name, c.full_name, c.customer_code, c.phone, c.email, u.full_name
  `;

  try {
    const { rows } = await db.query(query, [loanId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching loan details:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan details",
    });
  }
}
