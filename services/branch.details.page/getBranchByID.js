import pool from "../../db.js";

/**
 * GET /api/branches/:branchId
 *
 * Purpose:
 * - Fetch core branch information
 * - Fetch assigned branch manager (if any)
 *
 * Used by:
 * - BranchHeader
 * - EditBranchModal
 */

export async function getBranchById(req, res) {
  try {
    const { branchId } = req.params;

    const result = await pool.query(
      `
  SELECT
    b.id,
    b.branch_code,
    b.branch_name,
    b.address,
    b.location,
    b.branch_type,
    b.state,
    b.email,
    b.branch_mobile,
    b.is_active,

    -- Manager details (may be NULL)
    jsonb_build_object(
      'id', m.user_id,
      'name', m.full_name,
      'phone', m.phone
    ) AS manager

  FROM branches b

  LEFT JOIN (
    SELECT
      u.branch_id,
      u.id AS user_id,
      e.full_name,
      e.phone
    FROM users u
    JOIN roles r ON r.id = u.role_id
    JOIN employees e ON e.user_id = u.id
    WHERE r.role_name = 'BRANCH_MANAGER'
  ) m ON m.branch_id = b.id

  WHERE b.id = $1
  `,
      [branchId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getBranchById error:", err);
    res.status(500).json({ error: "Failed to fetch branch details" });
  }
}
