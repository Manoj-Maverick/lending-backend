// controllers/customers/getCustomerProfile.js

import pool from "../../db.js";

/**
 * Get full customer profile for PersonalInfoTab
 * ------------------------------------------------
 * Returns:
 * - Basic customer info
 * - Address details
 * - Bank details
 * - Branch name
 * - KYC (masked): aadhaarLast4, panLast4
 * - Aggregated loan statistics
 *
 * READ-ONLY endpoint.
 */
export async function getCustomerProfile(req, res) {
  const { id } = req.params;

  // 1. Validate input
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid customer id" });
  }

  try {
    // 2. Query customer + branch + stats
    const query = `
  SELECT
    c.id,
    c.customer_code,
    c.full_name,
    c.phone,
    c.email,
    c.dob,
    c.gender,
    c.marital_status,
    c.occupation,
    c.monthly_income,
    c.address,
    c.city,
    c.state,
    c.pincode,
    c.bank_name,
    c.bank_account_no,
    c.ifsc_code,
    c.account_holder_name,
    c.created_at AS member_since,
    c.aadhaar_enc,
    c.aadhaar_last4,
    c.pan_last4,

    b.branch_name,
    b.id AS branch_id,

    -- ✅ Latest photo
    photo.file_url AS photo_url,

    COUNT(DISTINCT l.id) AS total_loans,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'ACTIVE') AS active_loans,
    COALESCE(SUM(DISTINCT l.total_payable), 0) AS total_disbursed,
    COALESCE(SUM(DISTINCT l.total_payable), 0)
      - COALESCE(SUM(p.paid_amount), 0) AS outstanding

  FROM customers c

  JOIN branches b ON b.id = c.branch_id

  -- ✅ Safely fetch latest active photo
  LEFT JOIN LATERAL (
      SELECT cd.file_url
      FROM customer_documents cd
      WHERE cd.customer_id = c.id
        AND cd.document_type = 'PHOTO'
        AND cd.is_active = TRUE
      ORDER BY cd.uploaded_at DESC
      LIMIT 1
  ) photo ON TRUE

  LEFT JOIN loans l ON l.customer_id = c.id
  LEFT JOIN payments p ON p.loan_id = l.id

  WHERE c.id = $1

  GROUP BY 
    c.id,
    b.branch_name,
    b.id ,
    photo.file_url`;

    const { rows } = await pool.query(query, [id]);

    // 3. Not found check
    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const row = rows[0];

    // 4. Shape response for frontend
    const response = {
      id: row.id,
      code: row.customer_code,
      name: row.full_name,
      phone: row.phone,
      email: row.email,
      branch: row.branch_name,
      branchId: row.branch_id,
      memberSince: row.member_since,
      dateOfBirth: row.dob,
      gender: row.gender,
      maritalStatus: row.marital_status,
      occupation: row.occupation,
      monthlyIncome: row.monthly_income,

      kyc: {
        aadhaar_enc: row.aadhaar_enc, // e.g. "ENC(A1B2C3D4)"
        aadhaarLast4: row.aadhaar_last4, // e.g. "1234"
        panLast4: row.pan_last4, // e.g. "A1B2"
      },

      address: {
        street: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.pincode,
      },

      bankInfo: {
        bankName: row.bank_name,
        accountNumber: row.bank_account_no
          ? "****" + row.bank_account_no.slice(-4)
          : null,
        accountHolderName: row.account_holder_name,
        ifscCode: row.ifsc_code,
      },

      stats: {
        totalLoans: Number(row.total_loans),
        activeLoans: Number(row.active_loans),
        totalDisbursed: Number(row.total_disbursed),
        outstanding: Number(row.outstanding),
      },
      photo_url: row.photo_url,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error fetching customer profile:", err);
    return res.status(500).json({ error: "Failed to fetch customer profile" });
  }
}
