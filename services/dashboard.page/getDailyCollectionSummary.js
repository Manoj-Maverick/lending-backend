import db from "../../db.js";

export async function getWeeklyCollection(req, res) {
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
WITH days AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::date AS day_date
)

SELECT
    TRIM(TO_CHAR(d.day_date,'Day')) AS day,

    COALESCE(
        SUM(ls.due_amount + ls.fine_amount)
        FILTER (WHERE $1::INTEGER IS NULL OR l.branch_id = $1),
    0) AS expected,

    COALESCE(
        SUM(p.paid_amount + p.fine_paid)
        FILTER (WHERE $1::INTEGER IS NULL OR l.branch_id = $1),
    0) AS collected,

    CASE
        WHEN COALESCE(
            SUM(ls.due_amount + ls.fine_amount)
            FILTER (WHERE $1::INTEGER IS NULL OR l.branch_id = $1),
        0) = 0
        THEN 0
        ELSE ROUND(
            COALESCE(
                SUM(p.paid_amount + p.fine_paid)
                FILTER (WHERE $1::INTEGER IS NULL OR l.branch_id = $1),
            0)
            /
            SUM(ls.due_amount + ls.fine_amount)
            FILTER (WHERE $1::INTEGER IS NULL OR l.branch_id = $1)
            * 100
        ,2)
    END AS percentage

FROM days d

LEFT JOIN loan_schedule ls
    ON ls.due_date = d.day_date

LEFT JOIN loans l
    ON l.id = ls.loan_id

LEFT JOIN payments p
    ON p.schedule_id = ls.id

GROUP BY d.day_date

ORDER BY d.day_date
`;

  try {
    const { rows } = await db.query(query, [branchId]);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Weekly collection error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly collection",
    });
  }
}
