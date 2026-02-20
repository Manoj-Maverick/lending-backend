import db from "../../db.js";

/**
 * GET /api/staff
 * Query params:
 *  - search
 *  - branch
 *  - role
 *  - sortKey
 *  - sortDir (asc|desc)
 *  - page
 *  - pageSize
 */
export async function getStaffsList(req, res) {
  console.log("Received getStaffsList request with params:", req.query);
  const {
    search = "",
    branch = "all",
    role = "all",
    sortKey = "name",
    sortDir = "asc",
    page = 1,
    pageSize = 10,
  } = req.query;
  console.log("Receiveds getStaffsList request with params:", req.query);

  const limit = Math.max(Number(pageSize), 1);
  const offset = (Math.max(Number(page), 1) - 1) * limit;

  const params = [];
  let whereClauses = [];
  let idx = 1;

  // 🔎 Search filter
  if (search && search.trim() !== "") {
    params.push(`%${search}%`);
    whereClauses.push(`
      (
        e.full_name ILIKE $${idx}
        OR e.email ILIKE $${idx}
        OR e.phone ILIKE $${idx}
        OR e.employee_code ILIKE $${idx}
      )
    `);
    idx++;
  }

  // 🏢 Branch filter (by branch name)
  if (branch !== "all") {
    params.push(Number(branch));
    whereClauses.push(`b.id = $${idx++}`);
  }

  // 🧑 Role filter (by role name)
  if (role !== "all") {
    params.push(role);
    whereClauses.push(`r.role_name = $${idx++}`);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // ✅ Whitelist sortable columns (security)
  const SORT_MAP = {
    name: "e.full_name",
    email: "e.email",
    role: "r.role_name",
    branch: "b.branch_name",
    status: "e.is_active",
    joinDate: "e.join_date",
  };

  const orderByCol = SORT_MAP[sortKey] || "e.full_name";
  const orderDir = sortDir?.toLowerCase() === "desc" ? "DESC" : "ASC";

  const listQuery = `
    SELECT
      e.id,
      e.employee_code AS code,
      e.full_name AS name,
      e.email,
      e.phone,
      r.role_name AS role,
      b.branch_name AS branch,
      e.is_active AS status,
      e.join_date AS "joinDate"
    FROM employees e
    JOIN users u ON u.id = e.user_id
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${whereSQL}
    ORDER BY ${orderByCol} ${orderDir}
    LIMIT $${idx} OFFSET $${idx + 1};
  `;

  console.log("Constructed SQL Query:", listQuery);
  console.log("With parameters:", [...params, limit, offset]);

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM employees e
    JOIN users u ON u.id = e.user_id
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${whereSQL};
  `;

  try {
    const listParams = [...params, limit, offset];

    const [listResult, countResult] = await Promise.all([
      db.query(listQuery, listParams),
      db.query(countQuery, params),
    ]);
    console.log("Staff list query result:", listResult.rows);
    return res.json({
      success: true,
      data: listResult.rows,
      pagination: {
        page: Number(page),
        pageSize: limit,
        total: countResult.rows[0].total,
      },
    });
  } catch (err) {
    console.error("Error fetching staff list:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff list",
    });
  }
}
