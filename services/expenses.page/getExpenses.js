import pool from "../../db.js";

export async function getExpenses(req, res) {
  let {
    branch_id = null,
    category_id = null,
    start_date = null,
    end_date = null,
    page = 1,
    limit = 10,
  } = req.query;

  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset = (page - 1) * limit;

  branch_id = !branch_id || branch_id === "all" ? null : Number(branch_id);
  category_id =
    !category_id || category_id === "all" ? null : Number(category_id);

  try {
    const listQuery = `
      SELECT
        be.id,
        be.branch_id,
        b.branch_name,
        be.category_id,
        ec.name AS category_name,
        ec.is_fixed,
        be.amount,
        be.expense_date,
        be.notes,
        be.created_by,
        u.full_name AS created_by_name,
        be.created_at
      FROM branch_expenses be
      JOIN branches b ON b.id = be.branch_id
      JOIN expense_categories ec ON ec.id = be.category_id
      LEFT JOIN users u ON u.id = be.created_by
      WHERE ($1::int IS NULL OR be.branch_id = $1)
        AND ($2::int IS NULL OR be.category_id = $2)
        AND ($3::date IS NULL OR be.expense_date >= $3)
        AND ($4::date IS NULL OR be.expense_date <= $4)
      ORDER BY be.expense_date DESC, be.created_at DESC, be.id DESC
      LIMIT $5 OFFSET $6
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM branch_expenses be
      WHERE ($1::int IS NULL OR be.branch_id = $1)
        AND ($2::int IS NULL OR be.category_id = $2)
        AND ($3::date IS NULL OR be.expense_date >= $3)
        AND ($4::date IS NULL OR be.expense_date <= $4)
    `;

    const params = [branch_id, category_id, start_date, end_date];
    const [listResult, countResult] = await Promise.all([
      pool.query(listQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    const total = countResult.rows[0]?.total ?? 0;

    return res.json({
      success: true,
      data: listResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
}
