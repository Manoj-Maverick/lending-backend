import pool from "../../db.js";

export async function toggleCustomerBlock(customerId, isBlocked) {
  const { rows } = await pool.query(
    `
    UPDATE customers
    SET is_blacklisted = $1
    WHERE id = $2
    RETURNING id, is_blacklisted
    `,
    [isBlocked, customerId],
  );

  return rows[0];
}

export async function getCustomerBlockStatus(customerId) {
  const { rows } = await pool.query(
    `
    SELECT id, is_blacklisted
    FROM customers
    WHERE id = $1
    `,
    [customerId],
  );

  return rows[0];
}

export async function getBlockStatus(req, res) {
  try {
    const { customerId } = req.params;

    const data = await getCustomerBlockStatus(customerId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        is_blocked: data.is_blacklisted, // 🔥 map properly
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function blockCustomer(req, res) {
  try {
    const { customerId } = req.params;
    const { isBlocked } = req.body;

    const data = await toggleCustomerBlock(customerId, isBlocked);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
