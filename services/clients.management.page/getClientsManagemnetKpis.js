import pool from "../../db.js";

export async function getBorrowerStatsQ(branchId = null) {
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE c.is_active = true) AS total_borrowers,

      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM loans l
          WHERE l.customer_id = c.id
          AND l.status = 'ACTIVE'
        )
      ) AS active_loans,

      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM loan_schedule ls
          JOIN loans l ON l.id = ls.loan_id
          WHERE l.customer_id = c.id
          AND ls.status = 'DELAYED'
        )
      ) AS delayed,

      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM loans l
          WHERE l.customer_id = c.id
          AND l.status = 'ACTIVE'
        )
      ) AS no_loan,

      COUNT(*) FILTER (WHERE c.is_blacklisted = true) AS blocked

    FROM customers c
    WHERE c.is_active = true
      AND ($1::int IS NULL OR c.branch_id = $1)
  `;

  const { rows } = await pool.query(query, [branchId]);
  return rows[0];
}

export async function getBorrowerStats(req, res) {
  try {
    const { branchId } = req.query;
    console.log(branchId);

    const raw = await getBorrowerStatsQ(branchId || null);

    // ✅ Normalize + rename fields
    const data = {
      total: Number(raw.total_borrowers) || 0,
      active: Number(raw.active_loans) || 0,
      delayed: Number(raw.delayed) || 0,
      noLoan: Number(raw.no_loan) || 0,
      blocked: Number(raw.blocked) || 0,
    };

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Borrower stats error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
