import pool from "../../db.js";
import fs from "fs";
import path from "path";

// 🔐 TEMP encryption placeholders (replace with real crypto later)
function encrypt(text) {
  if (!text) return null;
  return Buffer.from(text).toString("base64"); // placeholder
}
function last4(text) {
  if (!text) return null;
  return text.slice(-4);
}

export const createCustomer = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      maritalStatus,
      email,
      phone,
      alternatePhone,
      occupation,
      monthlyIncome,
      aadhaarNumber,
      panNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      residenceType,
      yearsAtAddress,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      accountHolderName,
      branch, // this should be branch_id or branch_code mapping
      customerCode,

      // guarantor fields (optional)
      guarantorFullName,
      guarantorPhone,
      guarantorRelation,
      guarantorAddress,
      guarantorOccupation,
      guarantorMonthlyIncome,
      guarantorAadhaar,
      guarantorPan,
      guarantorCity,
      guarantorState,
      guarantorPincode,
    } = req.body;

    await client.query("BEGIN");

    // 1️⃣ Insert customer
    const address = [addressLine1, addressLine2].filter(Boolean).join(", ");

    const insertCustomer = `
      INSERT INTO customers (
        customer_code, branch_id, full_name, phone, alternate_phone, email,
        address, city, state, pincode,
        bank_account_no, bank_name, ifsc_code, account_holder_name,
        dob, gender, marital_status, occupation, monthly_income,
        aadhaar_enc, aadhaar_last4, pan_enc, pan_last4,
        residence_type, years_at_address, account_type
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26
      )
      RETURNING id
    `;

    const customerResult = await client.query(insertCustomer, [
      customerCode,
      branch, // ⚠️ ideally branch_id, not code
      fullName,
      phone,
      alternatePhone || null,
      email || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      accountNumber || null,
      bankName || null,
      ifscCode || null,
      accountHolderName || null,
      dateOfBirth || null,
      gender || null,
      maritalStatus || null,
      occupation || null,
      monthlyIncome || null,
      encrypt(aadhaarNumber),
      last4(aadhaarNumber),
      encrypt(panNumber),
      last4(panNumber),
      residenceType || null,
      yearsAtAddress || null,
      accountType || null,
    ]);

    const customerId = customerResult.rows[0].id;

    // 2️⃣ Create customer folder
    const customerDir = path.join(
      process.cwd(),
      "uploads",
      "customers",
      String(customerId),
    );
    fs.mkdirSync(customerDir, { recursive: true });

    // 3️⃣ Save documents
    const files = req.files || {};

    const saveDoc = async (file, type) => {
      const newPath = path.join(customerDir, file.filename);
      fs.renameSync(file.path, newPath);

      const fileUrl = `/uploads/customers/${customerId}/${file.filename}`;

      await client.query(
        `
        INSERT INTO customer_documents (customer_id, document_type, file_url)
        VALUES ($1, $2, $3)
        `,
        [customerId, type, fileUrl],
      );
    };

    if (files.photo) await saveDoc(files.photo[0], "PHOTO");
    if (files.idProof) await saveDoc(files.idProof[0], "ID_PROOF");
    if (files.addressProof)
      await saveDoc(files.addressProof[0], "ADDRESS_PROOF");
    if (files.incomeProof) await saveDoc(files.incomeProof[0], "INCOME_PROOF");

    // 4️⃣ Optional: Insert guarantor
    let guarantorId = null;
    if (guarantorFullName && guarantorPhone && guarantorRelation) {
      const insertGuarantor = `
        INSERT INTO guarantors (
          customer_id, full_name, phone, address, city, state, pincode, relation,
          occupation, monthly_income, aadhaar_enc, aadhaar_last4, pan_enc, pan_last4
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14
        )
        RETURNING id
      `;

      const gRes = await client.query(insertGuarantor, [
        customerId,
        guarantorFullName,
        guarantorPhone,
        guarantorAddress || null,
        guarantorCity || null,
        guarantorState || null,
        guarantorPincode || null,
        guarantorRelation,
        guarantorOccupation || null,
        guarantorMonthlyIncome || null,
        encrypt(guarantorAadhaar),
        last4(guarantorAadhaar),
        encrypt(guarantorPan),
        last4(guarantorPan),
      ]);

      guarantorId = gRes.rows[0].id;

      // create guarantor folder
      const guarantorDir = path.join(
        process.cwd(),
        "uploads",
        "guarantors",
        String(guarantorId),
      );
      fs.mkdirSync(guarantorDir, { recursive: true });
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      customerId,
      guarantorId,
      message: "Customer created successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create customer failed:", err);
    res.status(500).json({ error: "Failed to create customer" });
  } finally {
    client.release();
  }
};
