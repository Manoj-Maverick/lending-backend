// services/document.core.js
import pool from "../db.js";
import fs from "fs";
import { storeFile } from "./storage.service.js";

/**
 * Deactivate old document (same type)
 */
async function deactivateOld({
  client,
  category,
  entity_id,
  document_type,
  loan_id,
}) {
  if (category === "customer") {
    await client.query(
      `UPDATE customer_documents
       SET is_active = false
       WHERE customer_id = $1 AND document_type = $2 AND is_active = true`,
      [entity_id, document_type],
    );
  }

  if (category === "guarantor") {
    await client.query(
      `UPDATE guarantor_documents
       SET is_active = false
       WHERE guarantor_id = $1 AND document_type = $2 AND is_active = true`,
      [entity_id, document_type],
    );
  }

  if (category === "loan") {
    if (!loan_id || isNaN(loan_id)) {
      throw new Error("Invalid loan_id");
    }

    await client.query(
      `UPDATE loan_documents
     SET is_active = false
     WHERE loan_id = $1 AND document_type = $2 AND is_active = true`,
      [loan_id, document_type],
    );
  }
}

/**
 * Insert document into correct table
 */
async function insertDocument({
  client,
  category,
  entity_id,
  loan_id,
  document_type,
  file,
  file_url,
  uploaded_by,
}) {
  if (category === "customer") {
    const { rows } = await client.query(
      `INSERT INTO customer_documents
       (customer_id, document_type, file_name, file_url, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        entity_id,
        document_type,
        file.originalname,
        file_url,
        file.mimetype,
        file.size,
        uploaded_by,
      ],
    );
    return rows[0];
  }

  if (category === "guarantor") {
    const { rows } = await client.query(
      `INSERT INTO guarantor_documents
       (guarantor_id, document_type, file_name, file_url, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        entity_id,
        document_type,
        file.originalname,
        file_url,
        file.mimetype,
        file.size,
        uploaded_by,
      ],
    );
    return rows[0];
  }

  if (category === "loan") {
    const { rows } = await client.query(
      `INSERT INTO loan_documents
       (loan_id, customer_id, document_type, file_name, file_url, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        loan_id,
        null,
        document_type,
        file.originalname,
        file_url,
        file.mimetype,
        file.size,
        uploaded_by,
      ],
    );
    return rows[0];
  }

  throw new Error("Invalid category");
}

/**
 * 🔥 MAIN FUNCTION (use everywhere)
 */
export async function uploadDocumentCore({
  category,
  entity_id,
  loan_id,
  document_type,
  file,
  uploaded_by,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Store file (via storage layer)
    const file_url = await storeFile({
      file,
      category,
      entity_id,
      loan_id,
    });

    // 2️⃣ Deactivate old version
    await deactivateOld({
      client,
      category,
      entity_id,
      loan_id,
      document_type,
    });

    // 3️⃣ Insert new document
    const doc = await insertDocument({
      client,
      category,
      entity_id,
      loan_id,
      document_type,
      file,
      file_url,
      uploaded_by,
    });

    await client.query("COMMIT");

    return doc;
  } catch (err) {
    await client.query("ROLLBACK");

    // cleanup tmp file if still exists
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    throw err;
  } finally {
    client.release();
  }
}

/**
 * Soft delete document
 */
export async function deleteDocumentCore({ category, id }) {
  if (category === "customer") {
    await pool.query(
      `UPDATE customer_documents SET is_active = false WHERE id = $1`,
      [id],
    );
  }

  if (category === "guarantor") {
    await pool.query(
      `UPDATE guarantor_documents SET is_active = false WHERE id = $1`,
      [id],
    );
  }

  if (category === "loan") {
    await pool.query(
      `UPDATE loan_documents SET is_active = false WHERE id = $1`,
      [id],
    );
  }
}
