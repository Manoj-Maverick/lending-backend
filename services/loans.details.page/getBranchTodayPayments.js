import db from "../../db.js";

export async function getBranchTodayPayments(req, res) {
  const { branch } = req.query;

  if (!branch) {
    return res.status(400).json({
      success: false,
      message: "Branch required",
    });
  }

  const query = `

  SELECT
      ls.id AS schedule_id,
      l.id AS loan_id,
      l.loan_code,

      c.full_name AS client_name,
      c.customer_code AS client_code,
      c.phone,

      photo.file_url AS avatar,

      ls.due_amount,
      ls.status

  FROM loan_schedule ls

  JOIN loans l
      ON l.id = ls.loan_id

  JOIN customers c
      ON c.id = l.customer_id

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
      ls.due_date = CURRENT_DATE
      AND l.branch_id = $1

  ORDER BY ls.status, c.full_name

  `;

  try {
    const { rows } = await db.query(query, [branch]);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Branch today payments error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch today's collections",
    });
  }
}
