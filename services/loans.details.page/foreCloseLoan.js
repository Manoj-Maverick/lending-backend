import db from "../../db.js";

export async function forecloseLoan(req, res) {
  const { loan_id, paid_amount, payment_mode, reference_no } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Fetch schedules that DO NOT already have payments
    const { rows: schedules } = await client.query(
      `
      SELECT
        ls.id,
        ls.due_amount,
        ls.fine_amount
      FROM loan_schedule ls
      LEFT JOIN payments p
        ON p.schedule_id = ls.id
      WHERE ls.loan_id = $1
      AND p.schedule_id IS NULL
      ORDER BY ls.installment_no
      `,
      [loan_id],
    );

    if (!schedules.length) {
      throw new Error("Loan already settled or no unpaid schedules");
    }

    let remaining = Number(paid_amount);

    const paymentRows = [];
    const scheduleIds = [];

    for (const s of schedules) {
      const principal = Number(s.due_amount);
      const fine = Number(s.fine_amount);

      const total = principal + fine;

      if (remaining <= 0) break;

      const payPrincipal = Math.min(remaining, principal);

      paymentRows.push([
        loan_id,
        s.id,
        payPrincipal,
        new Date(),
        payment_mode,
        reference_no,
        fine,
      ]);

      scheduleIds.push(s.id);

      // subtract principal + fine from remaining
      remaining -= payPrincipal + fine;
    }

    if (!paymentRows.length) {
      throw new Error("Invalid foreclosure amount");
    }

    // 2️⃣ Build bulk insert query
    const values = paymentRows
      .map(
        (_, i) =>
          `($${i * 7 + 1},$${i * 7 + 2},$${i * 7 + 3},$${i * 7 + 4},$${i * 7 + 5},$${i * 7 + 6},$${i * 7 + 7})`,
      )
      .join(",");

    const flatValues = paymentRows.flat();

    await client.query(
      `
      INSERT INTO payments
      (
        loan_id,
        schedule_id,
        paid_amount,
        paid_date,
        payment_mode,
        reference_no,
        fine_paid
      )
      VALUES ${values}
      ON CONFLICT (schedule_id) DO NOTHING
      `,
      flatValues,
    );

    // 3️⃣ Mark schedules as PAID
    await client.query(
      `
      UPDATE loan_schedule
      SET status = 'PAID'
      WHERE id = ANY($1::int[])
      `,
      [scheduleIds],
    );

    // 4️⃣ Close the loan
    await client.query(
      `
      UPDATE loans
      SET status = 'FORECLOSED',
          closure_reason = 'Manual foreclosure'
      WHERE id = $1
      `,
      [loan_id],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Loan foreclosed successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Foreclosure error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
}
