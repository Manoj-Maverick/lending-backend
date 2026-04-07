import pool from "../../db.js";

export async function getExpenseSummary(req, res) {
  let { branch_id = null, start_date = null, end_date = null } = req.query;
  branch_id = !branch_id || branch_id === "all" ? null : Number(branch_id);

  try {
    const summaryQuery = `
      WITH expense_totals AS (
        SELECT
          COALESCE(SUM(be.amount), 0) AS expense_total,
          COALESCE(SUM(CASE WHEN ec.is_fixed THEN be.amount ELSE 0 END), 0) AS fixed_expense,
          COALESCE(SUM(CASE WHEN NOT ec.is_fixed THEN be.amount ELSE 0 END), 0) AS variable_expense
        FROM branch_expenses be
        JOIN expense_categories ec ON ec.id = be.category_id
        WHERE ($1::int IS NULL OR be.branch_id = $1)
          AND ($2::date IS NULL OR be.expense_date >= $2)
          AND ($3::date IS NULL OR be.expense_date <= $3)
      ),
      salary_totals AS (
        SELECT
          COALESCE(SUM(ss.salary_amount + ss.bonus - ss.deductions), 0) AS salary_total
        FROM staff_salary ss
        WHERE ($1::int IS NULL OR ss.branch_id = $1)
          AND ($2::date IS NULL OR ss.month >= date_trunc('month', $2::date))
          AND ($3::date IS NULL OR ss.month <= date_trunc('month', $3::date))
      )
      SELECT
        expense_totals.expense_total,
        expense_totals.fixed_expense,
        expense_totals.variable_expense,
        salary_totals.salary_total,
        expense_totals.expense_total + salary_totals.salary_total AS total_expense
      FROM expense_totals, salary_totals
    `;

    const categoryQuery = `
      SELECT
        ec.id,
        ec.name,
        ec.is_fixed,
        COALESCE(SUM(be.amount), 0) AS total_amount
      FROM expense_categories ec
      LEFT JOIN branch_expenses be
        ON be.category_id = ec.id
        AND ($1::int IS NULL OR be.branch_id = $1)
        AND ($2::date IS NULL OR be.expense_date >= $2)
        AND ($3::date IS NULL OR be.expense_date <= $3)
      GROUP BY ec.id, ec.name, ec.is_fixed
      ORDER BY total_amount DESC, ec.name ASC
    `;

    const [summaryResult, categoryResult] = await Promise.all([
      pool.query(summaryQuery, [branch_id, start_date, end_date]),
      pool.query(categoryQuery, [branch_id, start_date, end_date]),
    ]);

    return res.json({
      success: true,
      data: {
        ...summaryResult.rows[0],
        category_breakdown: categoryResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense summary",
    });
  }
}
