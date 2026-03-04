import pool from "../../db.js";

/**
 * GET /api/branches
 * Branch Management - READ
 */
export async function getBranches(req, res) {
  console.log(req.query);
  try {
    // 1️⃣ Read & normalize query params
    let {
      page = 1,
      limit = 12,
      search = null,
      status = "all",
      sortBy = "name-asc",
    } = req.query;
    console.log("before", page, limit, search, status, sortBy);
    page = Math.max(1, Number(page));
    limit = Math.min(50, Math.max(1, Number(limit)));
    const offset = (page - 1) * limit;

    search = search?.trim() || null;

    let isActive = null;
    if (status === "active") isActive = true;
    if (status === "inactive") isActive = false;
    console.log("after", page, limit, search, status, sortBy);
    // 2️⃣ BASE BRANCH LIST (FILTER + PAGINATION)
    const baseQuery = `
      SELECT
        b.id,
        b.branch_code,
        b.branch_name,
        b.address,
        b.location,
        b.branch_type,
        b.is_active
      FROM branches b
      WHERE
        ($1::text IS NULL OR
          b.branch_name ILIKE '%' || $1 || '%' OR
          b.branch_code ILIKE '%' || $1 || '%' OR
          b.location ILIKE '%' || $1 || '%'
        )
      AND ($2::boolean IS NULL OR b.is_active = $2)
      ORDER BY
        CASE WHEN $3 = 'name-asc' THEN b.branch_name END ASC,
        CASE WHEN $3 = 'name-desc' THEN b.branch_name END DESC,
        b.id ASC
      LIMIT $4 OFFSET $5
    `;

    const { rows: branches } = await pool.query(baseQuery, [
      search,
      isActive,
      sortBy,
      limit,
      offset,
    ]);

    // 3️⃣ COUNT QUERY (FOR PAGINATION)
    const countQuery = `
      SELECT COUNT(*)
      FROM branches b
      WHERE
        ($1::text IS NULL OR
          b.branch_name ILIKE '%' || $1 || '%' OR
          b.branch_code ILIKE '%' || $1 || '%' OR
          b.location ILIKE '%' || $1 || '%'
        )
      AND ($2::boolean IS NULL OR b.is_active = $2)
    `;

    const countResult = await pool.query(countQuery, [search, isActive]);
    const total = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // 4️⃣ EDGE CASE — NO BRANCHES
    if (branches.length === 0) {
      return res.json({
        data: [],
        pagination: { page, limit, total, totalPages },
      });
    }

    // 5️⃣ FETCH SUMMARY DATA (DB FUNCTION)
    const branchIds = branches.map((b) => b.id);

    const summaryQuery = `
      SELECT *
      FROM get_branch_management_summary($1::int[])
    `;

    const { rows: summaries } = await pool.query(summaryQuery, [branchIds]);

    // 6️⃣ BUILD SUMMARY MAP
    const summaryMap = {};
    for (const row of summaries) {
      summaryMap[row.branch_id] = row;
    }

    // 7️⃣ MERGE BASE + SUMMARY
    let merged = branches.map((branch) => {
      const s = summaryMap[branch.id] || {};

      return {
        ...branch,
        total_clients: s.total_clients ?? 0,
        active_loans: s.active_loans ?? 0,
        total_disbursed: s.total_disbursed ?? 0,
        total_collected: s.total_collected ?? 0,
        outstanding: s.outstanding ?? 0,

        staff_count: s.staff_count ?? 0,
        is_manager_assigned: s.is_manager_assigned ?? false,
        mgr_name: s.mgr_name ?? "not assigned",
        mgr_phone: s.mgr_phone ?? "not assigned",
      };
    });

    switch (sortBy) {
      case "name-desc":
        merged.sort((a, b) => b.branch_name.localeCompare(a.branch_name));
        break;

      case "name-asc":
        merged.sort((a, b) => a.branch_name.localeCompare(b.branch_name));
        break;

      case "clients-desc":
        merged.sort((a, b) => b.total_clients - a.total_clients);
        break;

      case "clients-asc":
        merged.sort((a, b) => a.total_clients - b.total_clients);
        break;

      case "collection-desc":
        merged.sort((a, b) => b.total_collected - a.total_collected);
        break;

      case "collection-asc":
        merged.sort((a, b) => a.total_collected - b.total_collected);
        break;

      default:
        break;
    }

    // 9️⃣ FINAL RESPONSE
    res.json({
      data: merged,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    console.error("Branch list error:", err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
}
