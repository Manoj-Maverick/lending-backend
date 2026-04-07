import pool from "../../db.js";

export async function getMonthlyTrend(req, res) {
  let { branch_id = null, start_date = null, end_date = null } = req.query;
  branch_id = !branch_id || branch_id === "all" ? null : Number(branch_id);

  try {
    const result = await pool.query(
      `
        WITH expense_months AS (
          SELECT
            date_trunc('month', be.expense_date)::date AS month,
            COALESCE(SUM(be.amount), 0) AS expense_total
          FROM branch_expenses be
          WHERE ($1::int IS NULL OR be.branch_id = $1)
            AND ($2::date IS NULL OR be.expense_date >= $2)
            AND ($3::date IS NULL OR be.expense_date <= $3)
          GROUP BY 1
        ),
        salary_months AS (
          SELECT
            date_trunc('month', ss.month)::date AS month,
            COALESCE(SUM(ss.salary_amount + ss.bonus - ss.deductions), 0) AS salary_total
          FROM staff_salary ss
          WHERE ($1::int IS NULL OR ss.branch_id = $1)
            AND ($2::date IS NULL OR ss.month >= date_trunc('month', $2::date))
            AND ($3::date IS NULL OR ss.month <= date_trunc('month', $3::date))
          GROUP BY 1
        ),
        combined_months AS (
          SELECT month FROM expense_months
          UNION
          SELECT month FROM salary_months
        )
        SELECT
          cm.month,
          COALESCE(em.expense_total, 0) AS expense_total,
          COALESCE(sm.salary_total, 0) AS salary_total,
          COALESCE(em.expense_total, 0) + COALESCE(sm.salary_total, 0) AS total_expense
        FROM combined_months cm
        LEFT JOIN expense_months em ON em.month = cm.month
        LEFT JOIN salary_months sm ON sm.month = cm.month
        ORDER BY cm.month ASC
      `,
      [branch_id, start_date, end_date],
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching monthly expense trend:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly expense trend",
    });
  }
}
