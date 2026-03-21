import db from "../../db.js";

export async function getBranchCustomers(req, res) {
  try {
    const {
      branchId,
      search = "",
      status = "all",
      blockStatus = "all",
      sortKey = "name",
      sortDir = "asc",
      page = 1,
      pageSize = 5,
    } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "branchId is required",
      });
    }

    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    // 🔐 Safe sorting map (matches frontend keys)
    const sortMap = {
      name: "t.name",
      code: "t.code",
      loan_status: "t.loan_status",
    };

    const orderBy = sortMap[sortKey] || "t.name";
    const direction = sortDir === "desc" ? "DESC" : "ASC";

    const query = `
      SELECT
        t.id,
        t.name,
        t.phone,
        t.code,

        -- ✅ camelCase mapping
        t.is_blocked AS "isBlocked",
        t.loan_status AS "loanStatus",
        t.photo_url AS "photo",

        COUNT(*) OVER() AS total_count

      FROM (
        SELECT 
          c.id,
          c.full_name AS name,
          c.phone,
          c.customer_code AS code,
          c.is_blacklisted AS is_blocked,

          -- 📸 latest photo
          photo.file_url AS photo_url,

          -- 🧠 loan status
          CASE
            WHEN EXISTS (
              SELECT 1 
              FROM loans l 
              WHERE l.customer_id = c.id 
                AND l.status = 'ACTIVE'
            ) THEN 'ACTIVE'
            ELSE 'No Loans'
          END AS loan_status

        FROM customers c

        -- ✅ latest photo
        LEFT JOIN LATERAL (
          SELECT cd.file_url
          FROM customer_documents cd
          WHERE cd.customer_id = c.id
            AND cd.document_type = 'PHOTO'
            AND cd.is_active = TRUE
          ORDER BY cd.uploaded_at DESC
          LIMIT 1
        ) photo ON TRUE

        WHERE c.branch_id = $1
          AND c.is_active = TRUE

          -- 🔍 search
          AND (
            $2 = '' OR
            c.full_name ILIKE '%' || $2 || '%' OR
            c.phone ILIKE '%' || $2 || '%' OR
            c.customer_code ILIKE '%' || $2 || '%'
          )
      ) t

      WHERE
        -- 📊 loan status filter
        ($3 = 'all' OR t.loan_status = $3)

        -- 🚫 block filter
        AND (
          $4 = 'all'
          OR ($4 = 'blocked' AND t.is_blocked = TRUE)
          OR ($4 = 'active' AND t.is_blocked = FALSE)
        )

      ORDER BY ${orderBy} ${direction}, t.name ASC

      LIMIT $5 OFFSET $6
    `;

    const values = [
      Number(branchId),
      search,
      status,
      blockStatus,
      limit,
      offset,
    ];

    const { rows } = await db.query(query, values);

    return res.json({
      success: true,
      data: rows,
      total: rows[0]?.total_count || 0,
    });
  } catch (err) {
    console.error("getBranchCustomers error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch customers",
    });
  }
}