import pool from "../../db.js";

export async function createExpense(req, res) {
  const { branch_id, category_id, amount, expense_date, notes } = req.body;
  const createdBy = req.user?.id ?? null;

  if (!branch_id || !category_id || !amount || !expense_date) {
    return res.status(400).json({
      success: false,
      message: "branch_id, category_id, amount, and expense_date are required",
    });
  }

  try {
    const branchCheck = await pool.query(
      "SELECT id FROM branches WHERE id = $1 LIMIT 1",
      [branch_id],
    );

    if (branchCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const categoryCheck = await pool.query(
      "SELECT id FROM expense_categories WHERE id = $1 LIMIT 1",
      [category_id],
    );

    if (categoryCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO branch_expenses (
          branch_id,
          category_id,
          amount,
          expense_date,
          notes,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [branch_id, category_id, amount, expense_date, notes?.trim() || null, createdBy],
    );

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
}
