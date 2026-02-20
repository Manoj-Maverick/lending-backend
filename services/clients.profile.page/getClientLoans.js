import db from "../../db.js"; // your pg pool / client

/**
 * Express controller:
 * Fetch all loans of a customer + summary stats.
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     loans: [...],
 *     stats: {
 *       totalLoans,
 *       activeLoans,
 *       totalDisbursed,
 *       totalOutstanding
 *     }
 *   }
 * }
 */
export async function getCustomerLoans(req, res) {
  const { customerId } = req.params;

  // Validate input
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid customerId",
    });
  }

  // 1) List query: one row per loan with calculated outstanding
  const loansQuery = `
    SELECT
      l.id,
      l.loan_code,
      l.principal_amount,
      l.interest_amount,
      l.total_payable,
      l.status,
      l.start_date,
      COALESCE(l.total_payable - COALESCE(SUM(p.paid_amount), 0), l.total_payable) AS outstanding
    FROM loans l
    LEFT JOIN payments p ON p.loan_id = l.id
    WHERE l.customer_id = $1
    GROUP BY l.id
    ORDER BY l.created_at DESC;
  `;

  // 2) Stats query: aggregated numbers for cards
  const statsQuery = `
    SELECT
      COUNT(*) AS total_loans,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_loans,
      COALESCE(SUM(principal_amount), 0) AS total_disbursed,
      COALESCE(
        SUM(total_payable) - COALESCE((
          SELECT SUM(p.paid_amount)
          FROM loans l2
          LEFT JOIN payments p ON p.loan_id = l2.id
          WHERE l2.customer_id = $1
        ), 0),
        0
      ) AS total_outstanding
    FROM loans
    WHERE customer_id = $1;
  `;

  try {
    // Run both queries in parallel
    const [loansResult, statsResult] = await Promise.all([
      db.query(loansQuery, [customerId]),
      db.query(statsQuery, [customerId]),
    ]);

    const loans = loansResult.rows;
    const statsRow = statsResult.rows[0];

    const stats = {
      totalLoans: Number(statsRow.total_loans) || 0,
      activeLoans: Number(statsRow.active_loans) || 0,
      totalDisbursed: Number(statsRow.total_disbursed) || 0,
      totalOutstanding: Number(statsRow.total_outstanding) || 0,
    };

    return res.json({
      success: true,
      data: {
        loans,
        stats,
      },
    });
  } catch (err) {
    console.error("Error fetching customer loans:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching customer loans",
    });
  }
}
