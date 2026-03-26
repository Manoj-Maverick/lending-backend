import pool from "../../db.js";
import { generatePDF } from "../../generators/doc.gen.js";
import { loanAgreementHTML } from "../../templates/loanAgreement.js";
import { loanStatementHTML } from "../../templates/loanLedeger.js";
import cloudinary from "../../Routes/couldinery.js";
import streamifier from "streamifier";
import fs from "fs";
import path from "path";

export async function generateLoanAgreementDoc(loanId, { test = false } = {}) {
  const client = await pool.connect();

  try {
    // 🧠 1️⃣ FETCH LOAN + CUSTOMER + PHOTO
    const loanRes = await client.query(
      `
      SELECT 
        l.id AS loan_id,
        l.loan_code,
        l.principal_amount,
        l.installment_amount,
        l.interest_rate,
        l.interest_amount,
        l.tenure_value,
        l.tenure_unit,
        l.repayment_type,
        l.processing_fee,
        l.penalty_rate,
        l.total_payable,
        l.status,
        l.sanctioned_date,
        l.start_date,
        l.last_due_date,
        l.approved_at,
        l.closure_reason,

        b.branch_name,

        -- 👤 CUSTOMER (REAL SCHEMA)
        c.full_name AS client_name,
        c.customer_code,
        c.phone,
        c.alternate_phone,
        c.email,
        c.dob,
        c.gender,
        c.marital_status,
        c.address,
        c.city,
        c.state,
        c.pincode,
        c.district,
        c.occupation,
        c.monthly_income,
        c.bank_account_no,
        c.bank_name,
        c.ifsc_code,
        c.account_holder_name,
        c.residence_type,
        c.years_at_address,
        c.aadhaar_last4,
        c.pan_last4,

        -- 📸 PHOTO
        photo.file_url AS photo_url

      FROM loans l
      JOIN customers c ON c.id = l.customer_id
      JOIN branches b ON b.id = l.branch_id

      LEFT JOIN LATERAL (
        SELECT cd.file_url
        FROM customer_documents cd
        WHERE cd.customer_id = c.id
          AND cd.document_type = 'PHOTO'
          AND cd.is_active = true
        ORDER BY cd.uploaded_at DESC
        LIMIT 1
      ) photo ON true

      WHERE l.id = $1
      `,
      [loanId],
    );

    if (loanRes.rowCount === 0) {
      throw new Error("Loan not found");
    }

    const loan = loanRes.rows[0];

    // 🧠 2️⃣ FETCH GUARANTOR
    const guarantorRes = await client.query(
      `
      SELECT 
        g.full_name,
        g.phone,
        g.alternate_phone,
        g.email,
        g.relation,
        g.address,
        g.city,
        g.state,
        g.pincode,
        g.occupation,
        g.monthly_income,
        g.aadhaar_last4,
        g.pan_last4
      FROM loan_guarantors lg
      JOIN guarantors g ON g.id = lg.guarantor_id
      WHERE lg.loan_id = $1
      LIMIT 1
      `,
      [loanId],
    );

    const guarantor = guarantorRes.rows[0] || null;

    // 🧠 3️⃣ FETCH SCHEDULE
    const scheduleRes = await client.query(
      `
      SELECT 
        installment_no,
        due_date,
        due_amount,
        fine_amount,
        status
      FROM loan_schedule
      WHERE loan_id = $1
      ORDER BY installment_no ASC
      `,
      [loanId],
    );

    const schedule = scheduleRes.rows;

    // 🧠 4️⃣ FORMAT DATA (STRICT)
    const data = {
      ...loan,

      // 📅 dates
      sanctioned_date: formatDate(loan.sanctioned_date),
      start_date: formatDate(loan.start_date),
      last_due_date: formatDate(loan.last_due_date),
      approved_at: formatDate(loan.approved_at),
      dob: formatDate(loan.dob),

      // 🏠 address
      full_address: [
        loan.address,
        loan.city,
        loan.district,
        loan.state,
        loan.pincode,
      ]
        .filter(Boolean)
        .join(", "),

      // 🧾 masked KYC
      aadhaar: loan.aadhaar_last4 ? `XXXX-XXXX-${loan.aadhaar_last4}` : "-",
      pan: loan.pan_last4 ? `XXXX${loan.pan_last4}` : "-",

      // 🧑 GUARANTOR SAFE
      guarantor_name: guarantor?.full_name || "-",
      guarantor_phone: guarantor?.phone || "-",
      guarantor_relation: guarantor?.relation || "-",
      guarantor_address: guarantor
        ? [
            guarantor.address,
            guarantor.city,
            guarantor.state,
            guarantor.pincode,
          ]
            .filter(Boolean)
            .join(", ")
        : "-",
      guarantor_income: guarantor?.monthly_income || "-",

      // 📸 photo fallback
      photo_url:
        loan.photo_url || "https://via.placeholder.com/120x140?text=No+Photo",

      // 📊 schedule
      schedule: schedule.map((s) => ({
        installment_no: s.installment_no,
        due_date: formatDate(s.due_date),
        due_amount: Number(s.due_amount || 0),
        fine_amount: Number(s.fine_amount || 0),
        status: s.status,
      })),
    };

    // 🧠 5️⃣ GENERATE HTML
    const html = loanAgreementHTML(data);

    // 🧠 6️⃣ GENERATE PDF
    const pdfBuffer = await generatePDF(html);

    // 🧪 TEST MODE
    if (test) {
      const filePath = path.join(process.cwd(), `loan-${loanId}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      console.log("✅ PDF saved locally:", filePath);

      return { mode: "test", filePath };
    }

    // ☁️ CLOUD
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `lendwid/docs/loan/${loanId}`,
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      streamifier.createReadStream(pdfBuffer).pipe(stream);
    });

    return {
      mode: "cloud",
      url: upload.secure_url,
      public_id: upload.public_id,
    };
  } catch (err) {
    console.error("Doc generation failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function generateLoanStatementDoc(loanId, { test = false } = {}) {
  const client = await pool.connect();

  try {
    // 🧠 1️⃣ FETCH LOAN + CUSTOMER
    const loanRes = await client.query(
      `
      SELECT 
        l.id,
        l.loan_code,
        l.principal_amount,
        l.total_payable,
        l.start_date,
        l.last_due_date,
        l.status,

        c.full_name AS client_name,
        c.customer_code,
        c.phone,

        b.branch_name

      FROM loans l
      JOIN customers c ON c.id = l.customer_id
      JOIN branches b ON b.id = l.branch_id
      WHERE l.id = $1
      `,
      [loanId],
    );

    if (loanRes.rowCount === 0) {
      throw new Error("Loan not found");
    }

    const loan = loanRes.rows[0];

    // 🧠 2️⃣ FETCH PAYMENTS
    const paymentsRes = await client.query(
      `
  SELECT 
    p.id,
    p.paid_date,
    p.paid_amount,
    p.fine_paid,
    p.payment_mode,
    ls.installment_no,
    ls.due_amount
  FROM payments p
  LEFT JOIN loan_schedule ls ON ls.id = p.schedule_id
  WHERE p.loan_id = $1
  ORDER BY p.paid_date ASC
  `,
      [loanId],
    );

    const paymentsRaw = paymentsRes.rows;

    // 🧠 3️⃣ CALCULATIONS
    let runningBalance = Number(loan.total_payable);
    let totalPaid = 0;
    let totalFine = 0;

    const payments = paymentsRaw.map((p) => {
      const paid = Number(p.paid_amount || 0);
      const fine = Number(p.fine_amount || 0);

      totalPaid += paid;
      totalFine += fine;

      runningBalance -= paid;

      return {
        date: formatDate(p.payment_date),
        installment_no: p.installment_no || "-",
        due_amount: Number(p.due_amount || 0),
        paid_amount: paid,
        fine_amount: fine,
        mode: p.payment_mode || "-",
        balance: Math.max(runningBalance, 0),

        status:
          paid >= (p.due_amount || 0)
            ? "Paid"
            : paid > 0
              ? "Partial"
              : "Pending",
      };
    });

    // 🧠 4️⃣ FINAL DATA
    const data = {
      ...loan,

      start_date: formatDate(loan.start_date),
      last_due_date: formatDate(loan.last_due_date),

      total_paid: totalPaid,
      total_fine: totalFine,
      pending_amount: Math.max(Number(loan.total_payable) - totalPaid, 0),

      payments,
    };

    console.log("Statement Data:", data);

    // 🧠 5️⃣ HTML
    const html = loanStatementHTML(data);

    // 🧠 6️⃣ PDF
    const pdfBuffer = await generatePDF(html);

    // 🧪 TEST MODE
    if (test) {
      const filePath = path.join(process.cwd(), `statement-${loanId}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      console.log("✅ Statement saved locally:", filePath);

      return {
        mode: "test",
        filePath,
      };
    }

    // ☁️ CLOUD
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `lendwid/docs/statements/${loanId}`,
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      streamifier.createReadStream(pdfBuffer).pipe(stream);
    });

    return {
      mode: "cloud",
      url: upload.secure_url,
      public_id: upload.public_id,
    };
  } catch (err) {
    console.error("Statement generation failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

// helper
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// (async () => {
//   try {
//     const res = await generateLoanAgreementDoc(1, { test: true });
//     console.log("RESULT:", res);
//   } catch (err) {
//     console.error("ERROR:", err);
//   }
// })();

// (async () => {
//   try {
//     const res = await generateLoanStatementDoc(1, { test: true });
//   } catch (err) {
//     console.log("error");
//   }
// })();
