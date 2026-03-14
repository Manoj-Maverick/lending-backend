import db from "../../db.js";

export async function getTodayPayments(req, res) {
  const { branch = "all" } = req.query;

  let branchId = null;

  if (branch !== "all") {
    const b = Number(branch);

    if (Number.isNaN(b)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch parameter",
      });
    }

    branchId = b;
  }

  const query = `
  SELECT
      ls.id AS schedule_id,
      ls.due_amount,
      ls.status,

      l.loan_code,

      c.full_name AS borrower_name,
      c.customer_code,
      l.id AS loan_id,

      b.branch_name,

      photo.file_url AS avatar

  FROM loan_schedule ls

  JOIN loans l
      ON l.id = ls.loan_id

  JOIN customers c
      ON c.id = l.customer_id

  JOIN branches b
      ON b.id = l.branch_id

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
      AND ls.status IN ('PENDING','DELAYED')

      AND (
          $1::INTEGER IS NULL
          OR l.branch_id = $1
      )

  ORDER BY
      ls.status,
      c.full_name
  `;

  try {
    const { rows } = await db.query(query, [branchId]);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Today payments error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch today payments",
    });
  }
}
