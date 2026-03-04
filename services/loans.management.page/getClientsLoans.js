import db from "../../db.js";

/**
 * GET /api/loans
 * Query params:
 *  - status
 *  - branch
 *  - search
 *  - page (default 1)
 *  - pageSize (default 20)
 */
export async function getClientsLoansList(req, res) {
  const {
    status = "all",
    branch = "all",
    search = "",
    page = "1",
    pageSize = "20",
  } = req.query;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * limitNum;

  const params = [];
  const whereClauses = [];
  let idx = 1;

  // Status filter
  if (status !== "all") {
    params.push(status.toUpperCase());
    whereClauses.push(`l.status = $${idx++}`);
  }

  // Branch filter
  if (branch !== "all") {
    const branchId = Number(branch);
    if (Number.isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch parameter",
      });
    }
    params.push(branchId);
    whereClauses.push(`l.branch_id = $${idx++}`);
  }

  // Search filter
  if (search && search.trim() !== "") {
    params.push(`%${search}%`);
    whereClauses.push(`
      (
        l.loan_code ILIKE $${idx}
        OR c.full_name ILIKE $${idx}
        OR c.customer_code ILIKE $${idx}
      )
    `);
    idx++;
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // --------
  // Count query
  // --------
  const countQuery = `
    SELECT COUNT(DISTINCT l.id) AS total
    FROM loans l
    JOIN customers c ON c.id = l.customer_id
    ${whereSQL};
  `;

  // --------
  // Data query (paged, schedule-driven)
  // --------
  const dataQuery = `
    SELECT
      l.id,
      l.loan_code,
      c.full_name AS client_name,
      c.customer_code AS client_code,
      b.branch_name AS branch,

      l.principal_amount AS loan_amount,
      l.installment_amount AS emi_amount,
      l.interest_amount,
      l.interest_rate,
      l.tenure_value,
      l.tenure_unit,
      l.repayment_type,
      l.status,
      

      /* Outstanding = sum of unpaid schedules (+ fine) */
      COALESCE((
        SELECT SUM(ls2.due_amount + ls2.fine_amount)
        FROM loan_schedule ls2
        WHERE ls2.loan_id = l.id
          AND ls2.status IN ('PENDING', 'DELAYED')
      ), 0) AS outstanding,

      /* Next EMI date = next pending/delayed schedule */
      (
        SELECT MIN(ls3.due_date)
        FROM loan_schedule ls3
        WHERE ls3.loan_id = l.id
          AND ls3.status IN ('PENDING', 'DELAYED')
      ) AS next_emi_date

    FROM loans l
    JOIN customers c ON c.id = l.customer_id
    JOIN branches b ON b.id = l.branch_id

    ${whereSQL}

    ORDER BY l.created_at DESC
    LIMIT ${limitNum} OFFSET ${offset};
  `;

  try {
    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      db.query(countQuery, params),
      db.query(dataQuery, params),
    ]);

    const total = Number(countRows[0]?.total || 0);

    return res.json({
      success: true,
      data: dataRows,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total,
      },
    });
  } catch (err) {
    console.error("Error fetching loans list:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loans list",
    });
  }
}
