import pool from "../../db.js";

export const getOverdueCount = async (req, res) => {
  try {
    let { branch_id } = req.query;

    // normalize
    if (!branch_id || branch_id === "null") {
      branch_id = null;
    }

    const result = await pool.query(
      `
      SELECT COUNT(*)::INT AS count
      FROM loan_schedule ls
      JOIN loans l ON l.id = ls.loan_id

      WHERE 
          -- 🔥 SAME LOGIC AS LIST API
          ls.due_date < CURRENT_DATE
          AND ls.status != 'PAID'

          AND l.status = 'ACTIVE'
          AND ($1::INT IS NULL OR l.branch_id = $1)
      `,
      [branch_id],
    );

    res.json({
      count: result.rows[0]?.count || 0,
    });
  } catch (err) {
    console.error("getOverdueCount error:", err);
    res.status(500).json({
      error: "Failed to fetch overdue count",
    });
  }
};
