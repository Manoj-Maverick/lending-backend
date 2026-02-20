import pool from "../../db.js";
/**
 * GET /api/branches/:branchId/staff
 *
 * Purpose:
 * - Fetch all employees assigned to a branch
 *
 * Used by:
 * - StaffManagement component
 */
export async function getBranchStaff(req, res) {
  try {
    const { branchId } = req.params;

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.full_name,
        e.designation,
        r.role_name,
        e.email,
        e.phone,
        e.is_active
      FROM employees e
      JOIN users u
        ON u.id = e.user_id
      JOIN roles r on r.id = e.role_id
      WHERE u.branch_id = $1
      ORDER BY e.full_name
      `,
      [branchId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getBranchStaff error:", err);
    res.status(500).json({ error: "Failed to fetch branch staff" });
  }
}
