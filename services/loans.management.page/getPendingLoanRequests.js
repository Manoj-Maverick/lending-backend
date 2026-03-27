import db from "../../db.js";

export async function getPendingLoanRequests(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const params = [];
    const whereClauses = [`l.status = 'PENDING_APPROVAL'`];
    let idx = 1;

    if (req.user.role === "BRANCH_MANAGER") {
      params.push(req.user.branchId);
      whereClauses.push(`l.branch_id = $${idx++}`);
    }

    const query = `
      SELECT
        l.id,
        l.loan_code,
        l.principal_amount,
        l.created_at,
        l.requested_at,
        c.full_name AS customer_name,
        c.customer_code,
        b.branch_name,
        requester.full_name AS requested_by_name,
        requester.username AS requested_by_username
      FROM loans l
      JOIN customers c ON c.id = l.customer_id
      JOIN branches b ON b.id = l.branch_id
      LEFT JOIN users requester ON requester.id = l.requested_by
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY COALESCE(l.requested_at, l.created_at) DESC
      LIMIT 10
    `;

    const result = await db.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
      summary: {
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending loan requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending loan requests",
    });
  }
}
