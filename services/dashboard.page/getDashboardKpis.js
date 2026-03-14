import db from "../../db.js";

export async function getDashboardKpis(req, res) {
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
   WITH filtered_loans AS (
  SELECT *
  FROM loans
  WHERE ($1::INTEGER IS NULL OR branch_id = $1)
),
filtered_customers AS (
  SELECT *
  FROM customers
  WHERE is_active = TRUE
    AND ($1::INTEGER IS NULL OR branch_id = $1)
),
filtered_schedule AS (
  SELECT ls.*
  FROM loan_schedule ls
  JOIN filtered_loans fl ON fl.id = ls.loan_id
),
filtered_payments AS (
  SELECT p.*
  FROM payments p
  JOIN filtered_loans fl ON fl.id = p.loan_id
)

SELECT
  /* total_branches */
  CASE
    WHEN $1::INTEGER IS NULL THEN (
      SELECT COUNT(*) FROM branches WHERE is_active = TRUE
    )
    ELSE NULL
  END AS total_branches,

  /* total_clients */
  (SELECT COUNT(*) FROM filtered_customers) AS total_clients,

  /* active_loans */
  (
    SELECT COUNT(*)
    FROM filtered_loans
    WHERE status = 'ACTIVE'
  ) AS active_loans,

  /* outstanding_amount */
  COALESCE((
    SELECT SUM(due_amount + fine_amount)
    FROM filtered_schedule
    WHERE status IN ('PENDING','DELAYED')
  ),0) AS outstanding_amount,

  /* today_due */
  COALESCE((
    SELECT SUM(due_amount + fine_amount)
    FROM filtered_schedule
    WHERE due_date = CURRENT_DATE
      AND status IN ('PENDING','DELAYED')
  ),0) AS today_due,

  /* today_collected */
  COALESCE((
    SELECT SUM(paid_amount + fine_paid)
    FROM filtered_payments
    WHERE paid_date = CURRENT_DATE
  ),0) AS today_collected,

  /* weekly_collection */
  COALESCE((
    SELECT SUM(due_amount + fine_amount)
    FROM filtered_schedule
    WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 days'
      AND status IN ('PENDING','DELAYED')
  ),0) AS weekly_collection;
  `;

  try {
    const { rows } = await db.query(query, [branchId]);

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("Error fetching dashboard KPIs:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard KPIs",
    });
  }
}
