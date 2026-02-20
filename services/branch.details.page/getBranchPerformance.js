import pool from "../../db.js";
/**
 * GET /api/branches/:branchId/performance
 *
 * Purpose:
 * - Fetch aggregated performance numbers for ONE branch
 * - Reuses DB summary logic (no duplication)
 *
 * Used by:
 * - PerformanceMetrics component
 */
export async function getBranchPerformance(req, res) {
  try {
    const { branchId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM get_branch_management_summary(ARRAY[$1]::int[])
      `,
      [branchId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getBranchPerformance error:", err);
    res.status(500).json({ error: "Failed to fetch branch performance" });
  }
}
