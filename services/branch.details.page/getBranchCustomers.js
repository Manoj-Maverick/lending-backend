import pool from "../../db.js";

/**
 * GET /api/branches/:branchId/clients
 *
 * Purpose:
 * - Fetch paginated, filtered, sorted clients for ONE branch
 * - Reuses DB function logic (no SQL duplication here)
 *
 * Used by:
 * - BranchCustomers component
 */
export async function getBranchCustomers(req, res) {
  try {
    const { branchId } = req.params;

    // Read query params from URL (with defaults)
    const {
      search = "",
      status = "all",
      sortKey = "name",
      sortDir = "asc",
      page = 1,
      pageSize = 5,
    } = req.query;

    // Convert page + pageSize into limit + offset (for SQL pagination)
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    // Call the DB function
    const result = await pool.query(
      `
      SELECT *
      FROM get_branch_customers($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        Number(branchId), // p_branch_id
        search, // p_search
        status, // p_status_filter ('all' | 'Active' | 'No Loan')
        sortKey, // p_sort_key
        sortDir, // p_sort_dir
        limit, // p_limit
        offset, // p_offset
      ],
    );

    const rows = result.rows;

    // total_count is same in every row (if rows exist)
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    // Shape the response for frontend
    res.json({
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        code: r.code,
        loanStatus: r.loan_status,
        isBlocked: r.is_blocked,
      })),
      total,
    });
  } catch (err) {
    console.error("getBranchClients error:", err);
    res.status(500).json({ error: "Failed to fetch branch clients" });
  }
}
