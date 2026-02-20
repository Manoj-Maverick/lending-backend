import db from "../../db.js";

/**
 * Get all active guarantors for a specific customer
 *
 * What it does:
 * - Validates customerId from params
 * - Checks if customer exists
 * - Fetches all active guarantors for that customer
 * - Returns empty array if none found
 *
 * Error handling:
 * - 400 if customerId is missing/invalid
 * - 404 if customer does not exist
 * - 500 for any DB / server error
 */
export const getCustomerGuarantors = async (req, res) => {
  const { customerId } = req.params;

  // 1. Basic validation
  if (!customerId || isNaN(Number(customerId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing customerId",
    });
  }

  try {
    // 2. Check if customer exists (important to avoid silent bugs)
    const customerCheck = await db.query(
      `SELECT id FROM customers WHERE id = $1 AND is_active = TRUE`,
      [customerId],
    );

    if (customerCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or inactive",
      });
    }

    // 3. Fetch guarantors
    const result = await db.query(
      `
      SELECT
        g.id,
        g.full_name,
        g.phone,
        g.email,
        g.address,
        g.relation,
        g.occupation,
        g.monthly_income
      FROM guarantors g
      WHERE g.customer_id = $1
        AND g.is_active = TRUE
      ORDER BY g.created_at DESC
      `,
      [customerId],
    );

    // 4. Return data (even if empty array, that’s OK)
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching guarantors:", error);

    // 5. Catch-all server/DB error
    return res.status(500).json({
      success: false,
      message: "Failed to fetch guarantors",
    });
  }
};
