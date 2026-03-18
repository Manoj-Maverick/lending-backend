import pool from "../../db.js";
import { encrypt, last4 } from "../../utils/cryto.js";
import { uploadDocumentCore } from "../document.core.js";

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
      area,
      district,
      state,
      pincode,
      residenceType,
      yearsAtAddress,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      accountHolderName,
      branch,
      customerCode,

      // guarantor fields
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

    // 0️⃣ Duplicate check
    const duplicateCheck = await client.query(
      `
      SELECT id, customer_code, full_name, phone
      FROM customers
      WHERE phone = $1
         OR aadhaar_last4 = $2
         OR pan_last4 = $3
      LIMIT 1
      `,
      [phone, last4(aadhaarNumber), last4(panNumber)],
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Customer may already exist",
        existingCustomer: duplicateCheck.rows[0],
      });
    }

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
        residence_type, years_at_address, account_type,
        district
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26, $27
      )
      RETURNING id
    `;

    const customerResult = await client.query(insertCustomer, [
      customerCode,
      branch,
      fullName,
      phone,
      alternatePhone || null,
      email || null,
      address || null,
      area || null,
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
      district,
    ]);

    const customerId = customerResult.rows[0].id;

    // 2️⃣ Save customer documents using CORE
    const files = req.files || {};

    if (files.photo) {
      await uploadDocumentCore({
        category: "customer",
        entity_id: customerId,
        document_type: "PHOTO",
        file: files.photo[0],
        uploaded_by: req.user?.id || null,
      });
    }

    if (files.idProof) {
      await uploadDocumentCore({
        category: "customer",
        entity_id: customerId,
        document_type: "ID_PROOF",
        file: files.idProof[0],
        uploaded_by: req.user?.id || null,
      });
    }

    if (files.addressProof) {
      await uploadDocumentCore({
        category: "customer",
        entity_id: customerId,
        document_type: "ADDRESS_PROOF",
        file: files.addressProof[0],
        uploaded_by: req.user?.id || null,
      });
    }

    if (files.incomeProof) {
      await uploadDocumentCore({
        category: "customer",
        entity_id: customerId,
        document_type: "INCOME_PROOF",
        file: files.incomeProof[0],
        uploaded_by: req.user?.id || null,
      });
    }

    // 3️⃣ Optional guarantor
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

      // (Optional) You can add guarantor docs here later using same core
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

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  } finally {
    client.release();
  }
};
