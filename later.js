app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "DB connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.log("Database connection error:", error);
    res.status(500).json({
      status: "DB connection error",
      error: error.message,
    });
  }
});

app.get("/customers", async (req, res) => {
  /**
   * @route   GET /customers
   * @desc    Fetch paginated list of customers for listing screen
   * @access  Branch users (filtered later), Admin sees all
   * @query   page (number), limit (number)
   * @returns Customers list with pagination metadata
   */
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const totalResult = await pool.query("SELECT COUNT(*) FROM customers");

    const customersResult = await pool.query(
      `
      SELECT
        id,
        customer_code,
        full_name,
        phone,
        city
      FROM customers
      ORDER BY id
      LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    res.json({
      page,
      limit,
      total: parseInt(totalResult.rows[0].count),
      data: customersResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.get("/customers/:id/loans", async (req, res) => {
  /**
   * @route   GET /customers/:id/loans
   * @desc    Fetch all loans belonging to a specific customer
   * @access  Branch users (same branch), Admin
   * @params  id (customer_id)
   * @returns List of loans with status & summary info
   */
  try {
    const customerId = parseInt(req.params.id);

    const result = await pool.query(
      `
      SELECT
        id,
        loan_code,
        status,
        total_payable,
        start_date
      FROM loans
      WHERE customer_id = $1
      ORDER BY id DESC
      `,
      [customerId],
    );

    res.json({
      customer_id: customerId,
      loans: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

app.get("/loans/:id/schedule", async (req, res) => {
  /**
   * @route   GET /loans/:id/schedule
   * @desc    Fetch weekly repayment schedule for a specific loan
   * @access  Branch users (same branch), Admin
   * @params  id (loan_id)
   * @returns Ordered list of weeks with due amount, status, and fine
   */
  try {
    const loanId = parseInt(req.params.id);

    const result = await pool.query(
      `
      SELECT
        id,
        week_no,
        due_date,
        due_amount,
        status,
        fine_amount
      FROM loan_schedule
      WHERE loan_id = $1
      ORDER BY week_no
      `,
      [loanId],
    );

    res.json({
      loan_id: loanId,
      schedule: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch loan schedule" });
  }
});

app.post("/loans/:loanId/payments", async (req, res) => {
  /**
   * @route   POST /loans/:loanId/payments
   * @desc    Record a payment for a specific loan week and update schedule status
   * @access  Branch users, Admin
   * @params  loanId (loan_id)
   * @body    schedule_id, paid_amount, fine_paid, payment_mode
   * @returns Payment success confirmation
   */
  const client = await pool.connect();
  try {
    const loanId = parseInt(req.params.loanId);
    const { schedule_id, paid_amount, fine_paid, payment_mode } = req.body;

    if (!schedule_id || !paid_amount || !payment_mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    // Insert payment record
    await client.query(
      `
      INSERT INTO payments (
        loan_id,
        schedule_id,
        paid_amount,
        paid_date,
        payment_mode,
        is_late,
        fine_paid
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
      `,
      [
        loanId,
        schedule_id,
        paid_amount,
        payment_mode,
        fine_paid > 0,
        fine_paid || 0,
      ],
    );

    // Update schedule status to PAID
    await client.query(
      `
      UPDATE loan_schedule
      SET status = 'PAID'
      WHERE id = $1
      `,
      [schedule_id],
    );

    // Auto-close loan if completed
    await client.query(`SELECT close_loan_if_completed($1)`, [loanId]);

    await client.query("COMMIT");

    res.json({ message: "Payment recorded successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Payment transaction failed" });
  } finally {
    client.release();
  }
});

app.post("/loans/:loanId/foreclose", async (req, res) => {
  /**
   * @route   POST /loans/:loanId/foreclose
   * @desc    Foreclose a loan either by self payment or by adjustment into a new loan
   * @access  Branch users, Admin
   * @params  loanId (loan_id)
   * @body    type (SELF | ADJUSTED), additional fields based on type
   * @returns Foreclosure confirmation
   */
  const client = await pool.connect();
  try {
    const loanId = parseInt(req.params.loanId);
    const { type } = req.body;

    await client.query("BEGIN");

    // Calculate remaining amount
    const remainingResult = await client.query(
      `
      SELECT
        l.customer_id,
        l.branch_id,
        l.total_payable - COALESCE(SUM(p.paid_amount), 0) AS remaining
      FROM loans l
      LEFT JOIN payments p ON p.loan_id = l.id
      WHERE l.id = $1
      GROUP BY l.id
      `,
      [loanId],
    );

    if (remainingResult.rowCount === 0) {
      throw new Error("Loan not found");
    }

    const { remaining, customer_id, branch_id } = remainingResult.rows[0];

    if (type === "SELF") {
      const { payment_mode, reference_no } = req.body;

      // Record final payment
      await client.query(
        `
        INSERT INTO payments (
          loan_id,
          paid_amount,
          paid_date,
          payment_mode,
          reference_no
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4)
        `,
        [loanId, remaining, payment_mode, reference_no],
      );

      // Mark all remaining schedules as PAID
      await client.query(
        `
        UPDATE loan_schedule
        SET status = 'PAID'
        WHERE loan_id = $1
        AND status != 'PAID'
        `,
        [loanId],
      );

      // Close loan
      await client.query(
        `
        UPDATE loans
        SET status = 'CLOSED',
            closure_type = 'FORECLOSURE_SELF',
            closure_reason = 'Foreclosed by full self payment'
        WHERE id = $1
        `,
        [loanId],
      );
    } else if (type === "ADJUSTED") {
      const {
        new_loan_code,
        new_principal,
        interest_amount,
        tenure_weeks,
        weekly_amount,
      } = req.body;

      // Mark remaining schedules as FORECLOSED
      await client.query(
        `
        UPDATE loan_schedule
        SET status = 'FORECLOSED'
        WHERE loan_id = $1
        AND status != 'PAID'
        `,
        [loanId],
      );

      // Foreclose old loan
      await client.query(
        `
        UPDATE loans
        SET status = 'FORECLOSED',
            closure_type = 'FORECLOSURE_ADJUSTED',
            closure_reason = 'Adjusted into new loan'
        WHERE id = $1
        `,
        [loanId],
      );

      // Create new adjusted loan
      const newLoanResult = await client.query(
        `
        INSERT INTO loans (
          loan_code,
          customer_id,
          branch_id,
          parent_loan_id,
          principal_amount,
          interest_amount,
          total_payable,
          tenure_weeks,
          weekly_amount,
          start_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE)
        RETURNING id
        `,
        [
          new_loan_code,
          customer_id,
          branch_id,
          loanId,
          new_principal,
          interest_amount,
          new_principal + interest_amount,
          tenure_weeks,
          weekly_amount,
        ],
      );

      // Generate schedule for new loan
      await client.query(`SELECT generate_loan_schedule($1)`, [
        newLoanResult.rows[0].id,
      ]);
    } else {
      throw new Error("Invalid foreclosure type");
    }

    await client.query("COMMIT");

    res.json({ message: "Loan foreclosed successfully", type });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
