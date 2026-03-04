import pool from "../../db.js";

export const createLoan = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ============================
    // 1️⃣ Parse Loan
    // ============================
    if (!req.body.loan) throw new Error("Loan payload missing");

    const loan = JSON.parse(req.body.loan);
    const { identity, financial, schedule, status } = loan;

    // ============================
    // 2️⃣ Validate
    // ============================
    const principal = Number(financial.principal_amount);
    const rate = Number(financial.interest_rate);
    const tenure = Number(schedule.tenure_value);
    const interval = Number(schedule.repayment_interval || 1);

    if (principal <= 0) throw new Error("Invalid principal");
    if (rate < 0) throw new Error("Invalid rate");
    if (tenure <= 0) throw new Error("Invalid tenure");

    // ============================
    // 3️⃣ Backend Financial Truth
    // ============================
    const totalInterest = principal * (rate / 100);
    const totalPayable = principal + totalInterest;
    const installment = Number((totalPayable / tenure).toFixed(2));

    // ============================
    // 4️⃣ Calculate Last Due Date
    // ============================
    const startDate = new Date(schedule.start_date);
    let lastDueDate = new Date(startDate);

    if (schedule.repayment_type === "WEEKLY") {
      lastDueDate.setDate(lastDueDate.getDate() + (tenure - 1) * 7 * interval);
    } else if (schedule.repayment_type === "DAILY") {
      lastDueDate.setDate(lastDueDate.getDate() + (tenure - 1) * interval);
    } else if (schedule.repayment_type === "MONTHLY") {
      lastDueDate.setMonth(lastDueDate.getMonth() + (tenure - 1) * interval);
    }

    // ============================
    // 5️⃣ Insert Loan
    // ============================
    const loanInsert = await client.query(
      `
      INSERT INTO loans (
        loan_code,
        customer_id,
        branch_id,
        parent_loan_id,
        principal_amount,
        interest_rate,
        interest_type,
        interest_amount,
        total_payable,
        tenure_value,
        tenure_unit,
        repayment_type,
        repayment_interval,
        installment_amount,
        sanctioned_date,
        start_date,
        last_due_date,
        collection_weekday,
        processing_fee,
        penalty_rate,
        grace_days,
        status,
        approved_by,
        approved_at
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,'FLAT',$7,$8,
        $9,$10,$11,$12,$13,
        $14,$15,$16,$17,
        $18,$19,$20,
        'ACTIVE',$21,$22
      )
      RETURNING id
      `,
      [
        identity.loan_code,
        identity.customer_id,
        identity.branch_id,
        identity.parent_loan_id,
        principal,
        rate,
        totalInterest,
        totalPayable,
        tenure,
        schedule.tenure_unit,
        schedule.repayment_type,
        interval,
        installment,
        schedule.sanctioned_date,
        schedule.start_date,
        lastDueDate.toISOString().split("T")[0],
        schedule.collection_weekday,
        Number(financial.processing_fee || 0),
        Number(financial.penalty_rate || 0),
        Number(financial.grace_days || 0),
        status.approved_by,
        status.approved_at,
      ],
    );

    const loanId = loanInsert.rows[0].id;

    // ============================
    // 6️⃣ Generate Schedule
    // ============================
    const values = [];
    const params = [];

    for (let i = 1; i <= tenure; i++) {
      const due = new Date(startDate);

      if (schedule.repayment_type === "WEEKLY") {
        due.setDate(due.getDate() + (i - 1) * 7 * interval);
      } else if (schedule.repayment_type === "DAILY") {
        due.setDate(due.getDate() + (i - 1) * interval);
      } else if (schedule.repayment_type === "MONTHLY") {
        due.setMonth(due.getMonth() + (i - 1) * interval);
      }

      const base = (i - 1) * 4;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);

      params.push(loanId, i, due.toISOString().split("T")[0], installment);
    }

    await client.query(
      `
      INSERT INTO loan_schedule (
        loan_id,
        installment_no,
        due_date,
        due_amount
      )
      VALUES ${values.join(",")}
      `,
      params,
    );

    // ============================
    // 7️⃣ Handle Guarantor
    // ============================
    const meta = JSON.parse(req.body.meta || "{}");
    const guarantorMode = meta.guarantor_mode;

    let guarantorId = null;

    if (guarantorMode === "existing") {
      if (!meta.guarantor_id) throw new Error("Guarantor ID required");

      const check = await client.query(
        `
        SELECT id FROM guarantors
        WHERE id = $1
        AND customer_id = $2
        AND is_active = true
        `,
        [meta.guarantor_id, identity.customer_id],
      );

      if (check.rowCount === 0) throw new Error("Invalid guarantor");

      guarantorId = meta.guarantor_id;
    }

    if (guarantorMode === "new") {
      const raw = req.body.guarantor;
      if (!raw) throw new Error("Guarantor missing");

      const g = JSON.parse(raw);

      const aadhaar = g.kyc?.aadhaar;
      const pan = g.kyc?.pan;

      if (!aadhaar || aadhaar.length !== 12) throw new Error("Invalid Aadhaar");

      if (!pan || pan.length !== 10) throw new Error("Invalid PAN");

      const aadhaarLast4 = aadhaar.slice(-4);
      const panLast4 = pan.slice(-4);

      const result = await client.query(
        `
        INSERT INTO guarantors (
          customer_id,
          full_name,
          phone,
          alternate_phone,
          email,
          address,
          city,
          state,
          pincode,
          relation,
          occupation,
          monthly_income,
          aadhaar_enc,
          aadhaar_last4,
          pan_enc,
          pan_last4,
          is_active
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,
          true
        )
        RETURNING id
        `,
        [
          identity.customer_id,
          g.personal.full_name,
          g.personal.phone,
          g.personal.alternate_phone,
          g.personal.email,
          g.address.address,
          g.address.city,
          g.address.state,
          g.address.pincode,
          g.personal.relation,
          g.financial.occupation,
          Number(g.financial.monthly_income || 0),
          aadhaar, // encrypted later if needed
          aadhaarLast4,
          pan,
          panLast4,
        ],
      );

      guarantorId = result.rows[0].id;
    }

    if (guarantorId) {
      await client.query(
        `
        INSERT INTO loan_guarantors (loan_id, guarantor_id)
        VALUES ($1, $2)
        `,
        [loanId, guarantorId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      loanId,
      message: "Loan + Schedule + Guarantor created successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Loan creation failed:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
