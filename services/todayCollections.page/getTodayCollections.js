import pool from "../../db.js";

export const getTodayCollections = async (req, res) => {
  try {
    let { start_date, end_date, branch_id } = req.query;
    console.log("Today Collections Params:", {
      start_date,
      end_date,
      branch_id,
    });
    if (branch_id == "null") branch_id = null;

    const result = await pool.query(
      `
      SELECT
          ls.id AS id,
          ls.due_date,
          ls.due_amount AS amount,

          c.full_name AS "clientName",
          c.customer_code AS "clientCode",
          c.phone,
          (SELECT cd.file_url from customer_documents cd WHERE cd.customer_id = c.id AND cd.document_type = 'PHOTO' LIMIT 1) AS profile_pic,

          l.loan_code,
          l.id AS "loanId",
          l.branch_id AS branch,

          CASE
            WHEN ls.status = 'PAID' THEN 'Paid'
            WHEN ls.due_date < CURRENT_DATE THEN 'Overdue'
            ELSE 'Pending'
          END AS status

      FROM loan_schedule ls
      JOIN loans l ON l.id = ls.loan_id
      JOIN customers c ON c.id = l.customer_id

      WHERE ls.due_date BETWEEN $1 AND $2
      AND ($3::INT IS NULL OR l.branch_id = $3)

      ORDER BY ls.due_date ASC
      `,
      [start_date, end_date, branch_id || null],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load collections" });
  }
};
