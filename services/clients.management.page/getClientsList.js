import pool from "../../db.js";

export async function getClientsList(req, res) {
  try {
    const {
      search = "",
      branchId = null,
      status = "all",
      blockStatus = "all",
      sortKey = "name",
      sortDir = "asc",
      page = 1,
      pageSize = 10,
    } = req.query;

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const result = await pool.query(
      `
      SELECT * FROM get_clients_list(
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      `,
      [
        branchId ? parseInt(branchId, 10) : null,
        search,
        status,
        blockStatus,
        sortKey,
        sortDir,
        limit,
        offset,
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
