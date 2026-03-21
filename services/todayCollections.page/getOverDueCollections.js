import pool from "../../db.js";

export const getOverdueCollections = async (req, res) => {
  try {
    let { start_date, end_date, branch_id } = req.query;
    console.log("hitting", req.query);

    // normalize branch_id
    if (!branch_id || branch_id === "null") {
      branch_id = null;
    }

    const result = await pool.query(
      `
      SELECT
          ls.id,
          ls.due_date,
          ls.due_amount AS amount,

          c.full_name AS "clientName",
          c.customer_code AS "clientCode",
          c.phone,

          -- ✅ latest photo
          photo.file_url AS profile_pic,

          l.loan_code,
          l.id AS "loanId",
          l.branch_id AS branch,

          -- ✅ overdue calculation (REAL LOGIC)
          (CURRENT_DATE - ls.due_date) AS days_overdue,

          COALESCE(ls.fine_amount, 0) AS penalty,

          'Overdue' AS status

      FROM loan_schedule ls

      JOIN loans l 
        ON l.id = ls.loan_id

      JOIN customers c 
        ON c.id = l.customer_id

      -- ✅ fetch latest photo (optimized)
      LEFT JOIN LATERAL (
          SELECT cd.file_url
          FROM customer_documents cd
          WHERE cd.customer_id = c.id
            AND cd.document_type = 'PHOTO'
            AND cd.is_active = TRUE
          ORDER BY cd.uploaded_at DESC
          LIMIT 1
      ) photo ON TRUE

      WHERE 
          -- 🔥 CORE FIX (DO NOT depend on status)
          ls.due_date < CURRENT_DATE
          AND ls.status != 'PAID'

          -- optional filters
          AND ($1::date IS NULL OR ls.due_date >= $1)
          AND ($2::date IS NULL OR ls.due_date <= $2)

          AND ($3::INT IS NULL OR l.branch_id = $3)

          -- only active loans
          AND l.status = 'ACTIVE'

      ORDER BY ls.due_date ASC
      `,
      [start_date || null, end_date || null, branch_id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getOverdueCollections error:", err);
    res.status(500).json({
      error: "Failed to load overdue collections",
    });
  }
};
