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
    SELECT
      /* total_branches (only when branch = all) */
      CASE
        WHEN $1::INTEGER IS NULL THEN (
          SELECT COUNT(*)
          FROM branches
          WHERE is_active = TRUE
        )
        ELSE NULL
      END AS total_branches,

      /* total_clients */
      (
        SELECT COUNT(*)
        FROM customers c
        WHERE c.is_active = TRUE
          AND ($1::INTEGER IS NULL OR c.branch_id = $1::INTEGER)
      ) AS total_clients,

      /* active_loans */
      (
        SELECT COUNT(*)
        FROM loans l
        WHERE l.status = 'ACTIVE'
          AND ($1::INTEGER IS NULL OR l.branch_id = $1::INTEGER)
      ) AS active_loans,

      /* outstanding_amount = sum of unpaid schedules (+ fine) */
      COALESCE((
        SELECT SUM(ls.due_amount + ls.fine_amount)
        FROM loan_schedule ls
        JOIN loans l2 ON l2.id = ls.loan_id
        WHERE ls.status IN ('PENDING', 'DELAYED')
          AND ($1::INTEGER IS NULL OR l2.branch_id = $1::INTEGER)
      ), 0) AS outstanding_amount,

      /* today_due = today's unpaid schedules */
      COALESCE((
        SELECT SUM(ls2.due_amount + ls2.fine_amount)
        FROM loan_schedule ls2
        JOIN loans l3 ON l3.id = ls2.loan_id
        WHERE ls2.due_date = CURRENT_DATE
          AND ls2.status IN ('PENDING', 'DELAYED')
          AND ($1::INTEGER IS NULL OR l3.branch_id = $1::INTEGER)
      ), 0) AS today_due,

      /* today_collected = payments made today */
      COALESCE((
        SELECT SUM(p.paid_amount + p.fine_paid)
        FROM payments p
        JOIN loans l4 ON l4.id = p.loan_id
        WHERE p.paid_date = CURRENT_DATE
          AND ($1::INTEGER IS NULL OR l4.branch_id = $1::INTEGER)
      ), 0) AS today_collected,

      /* weekly_collection = expected collection in next 7 days */
      COALESCE((
        SELECT SUM(ls3.due_amount + ls3.fine_amount)
        FROM loan_schedule ls3
        JOIN loans l5 ON l5.id = ls3.loan_id
        WHERE ls3.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 days'
          AND ls3.status IN ('PENDING', 'DELAYED')
          AND ($1::INTEGER IS NULL OR l5.branch_id = $1::INTEGER)
      ), 0) AS weekly_collection
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
