import pool from "../../db.js";

/**
 * GET /api/branches/:branchId/weekly-loans-summary
 *
 * Purpose:
 * - Return fixed weekdays (MON..SUN)
 * - For each day:
 *   - Count ACTIVE loans for this branch
 *   - Sum weekly_amount of ACTIVE loans for this branch
 *
 * Used by:
 * - Branch dashboard
 * - Branch analytics widgets
 */

export async function getWeeklyLoanSummaryByBranch(req, res) {
  try {
    const { branchId } = req.params;

    const result = await pool.query(
      `
      SELECT
        d.weekday,
        COALESCE(COUNT(l.id), 0) AS active_loans,
        COALESCE(SUM(l.installment_amount), 0) AS total_weekly_amount
      FROM (
        SELECT 'MON' AS weekday
        UNION ALL SELECT 'TUE'
        UNION ALL SELECT 'WED'
        UNION ALL SELECT 'THU'
        UNION ALL SELECT 'FRI'
        UNION ALL SELECT 'SAT'
        UNION ALL SELECT 'SUN'
      ) d
      LEFT JOIN loans l
        ON l.week_day = d.weekday
       AND l.status = 'ACTIVE'
       AND l.branch_id = $1
      GROUP BY d.weekday
      ORDER BY
        CASE d.weekday
          WHEN 'MON' THEN 1
          WHEN 'TUE' THEN 2
          WHEN 'WED' THEN 3
          WHEN 'THU' THEN 4
          WHEN 'FRI' THEN 5
          WHEN 'SAT' THEN 6
          WHEN 'SUN' THEN 7
        END;
      `,
      [branchId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getWeeklyLoanSummaryByBranch error:", err);
    res.status(500).json({ error: "Failed to fetch weekly loan summary" });
  }
}
