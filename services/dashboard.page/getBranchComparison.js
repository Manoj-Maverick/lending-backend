import db from "../../db.js";

export async function getBranchComparison(req, res) {
  const query = `
  SELECT
      b.id,
      b.branch_name AS branch,

      COUNT(DISTINCT c.id) FILTER (
          WHERE c.is_active = TRUE
      ) AS borrowers,

      COUNT(DISTINCT l.id) FILTER (
          WHERE l.status = 'ACTIVE'
      ) AS loans,

      COALESCE(SUM(p.paid_amount + p.fine_paid),0) AS collection

  FROM branches b

  LEFT JOIN customers c
      ON c.branch_id = b.id

  LEFT JOIN loans l
      ON l.branch_id = b.id

  LEFT JOIN payments p
      ON p.loan_id = l.id
      AND DATE_TRUNC('month', p.paid_date) = DATE_TRUNC('month', CURRENT_DATE)

  WHERE b.is_active = TRUE

  GROUP BY b.id, b.branch_name

  ORDER BY b.branch_name
  `;

  try {
    const { rows } = await db.query(query);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Branch comparison error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch comparison",
    });
  }
}
