import pool from "../../db.js";

export const recordPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { schedule_id, paid_amount, paid_date, payment_mode, reference_no } =
      req.body;

    // Basic validation
    if (!schedule_id) {
      return res.status(400).json({ error: "schedule_id is required" });
    }

    if (!paid_amount) {
      return res.status(400).json({ error: "paid_amount is required" });
    }

    if (!paid_date) {
      return res.status(400).json({ error: "paid_date is required" });
    }

    if (!payment_mode) {
      return res.status(400).json({ error: "payment_mode is required" });
    }

    // Call DB function
    await client.query(
      `
      SELECT record_payment(
        $1,$2,$3,$4,$5
      )
      `,
      [schedule_id, paid_amount, paid_date, payment_mode, reference_no || null],
    );

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
    });
  } catch (err) {
    console.error("Payment error:", err);

    res.status(500).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
};
