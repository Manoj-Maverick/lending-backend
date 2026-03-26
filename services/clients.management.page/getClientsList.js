import pool from "../../db.js";

export async function getClientsList(req, res) {
  try {
    const {
      search = "",
      branchId = null,
      status = "all",
      blockStatus = "all",
      repaymentType = null, // ✅ NEW
      sortKey = "name",
      sortDir = "asc",
      page = 1,
      pageSize = 10,
    } = req.query;

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    // 🔐 Safe sort mapping
    const sortMap = {
      name: "c.full_name",
      code: "c.customer_code",
      loan_status: "l.status",
    };

    const orderBy = sortMap[sortKey] || "c.full_name";
    const direction = sortDir === "desc" ? "DESC" : "ASC";

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.full_name AS name,
        c.customer_code AS code,
        c.phone,
        c.is_blacklisted,

        l.id AS loan_id,
        l.status AS loan_status,
        l.repayment_type,

        COUNT(*) OVER() AS total_count

      FROM customers c

      -- ✅ ONLY ACTIVE LOAN (important)
      LEFT JOIN loans l 
        ON l.customer_id = c.id
        AND l.status = 'ACTIVE'

      WHERE
        -- 🔍 SEARCH
        (
          $1::TEXT IS NULL OR
          c.full_name ILIKE '%' || $1 || '%' OR
          c.phone ILIKE '%' || $1 || '%' OR
          c.customer_code ILIKE '%' || $1 || '%'
        )

        -- 🏢 BRANCH
        AND ($2::INT IS NULL OR c.branch_id = $2)

        -- 🚫 BLOCK STATUS
        AND (
          $3 = 'all' OR
          ($3 = 'active' AND c.is_blacklisted = FALSE) OR
          ($3 = 'blocked' AND c.is_blacklisted = TRUE)
        )

        -- 📊 LOAN STATUS
        AND (
          $4 = 'all' OR
          ($4 = 'ACTIVE' AND l.id IS NOT NULL) OR
          ($4 = 'No Loans' AND l.id IS NULL)
        )

        -- 🔥 REPAYMENT TYPE FILTER
        AND (
          $5::TEXT IS NULL OR
          l.repayment_type = $5
        )

      ORDER BY ${orderBy} ${direction}

      LIMIT $6 OFFSET $7
      `,
      [
        search || null, // $1
        branchId ? parseInt(branchId, 10) : null, // $2
        blockStatus, // $3
        status, // $4
        repaymentType === "all" ? null : repaymentType, // $5
        limit, // $6
        offset, // $7
      ],
    );

    const rows = result.rows;
    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

    res.json({
      data: rows.map(({ total_count, ...r }) => r),
      total,
    });
  } catch (err) {
    console.error("getClientsList error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
}
