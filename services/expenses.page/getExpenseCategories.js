import pool from "../../db.js";

export async function getExpenseCategories(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        is_fixed,
        description,
        created_at
      FROM expense_categories
      ORDER BY is_fixed DESC, name ASC
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense categories",
    });
  }
}
