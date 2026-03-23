// services/document.core.js
import pool from "../../db.js";
import fs from "fs";
import { storeFile } from "./storage.service.js";
import cloudinary from "../../Routes/couldinery.js";

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
  public_id,
  uploaded_by,
}) {
  if (category === "customer") {
    const { rows } = await client.query(
      `INSERT INTO customer_documents
       (customer_id, document_type, file_name, file_url, public_id, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        entity_id,
        document_type,
        file.originalname,
        file_url,
        public_id,
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
       (guarantor_id, document_type, file_name, file_url, public_id, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        entity_id,
        document_type,
        file.originalname,
        file_url,
        public_id,
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
       (loan_id, customer_id, document_type, file_name, file_url, public_id, mime_type, file_size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        loan_id,
        null,
        document_type,
        file.originalname,
        file_url,
        public_id,
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
 * MAIN UPLOAD FUNCTION (UPDATED)
 */
export async function uploadDocumentCore({
  category,
  entity_id,
  loan_id,
  document_type,
  file,
  file_url, // 🔥 NEW
  public_id, // 🔥 NEW
  uploaded_by,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let final_url = file_url;
    let final_public_id = public_id;

    // 🔥 ONLY upload if NOT already uploaded (direct upload case)
    if (!final_url || !final_public_id) {
      const upload = await storeFile({
        file,
        category,
        entity_id,
        loan_id,
      });

      final_url = upload.url;
      final_public_id = upload.public_id;
    }

    // Deactivate old document
    await deactivateOld({
      client,
      category,
      entity_id,
      loan_id,
      document_type,
    });

    // Insert new record
    const doc = await insertDocument({
      client,
      category,
      entity_id,
      loan_id,
      document_type,
      file,
      file_url: final_url,
      public_id: final_public_id,
      uploaded_by,
    });

    await client.query("COMMIT");

    return doc;
  } catch (err) {
    await client.query("ROLLBACK");

    // cleanup local temp file if exists
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    throw err;
  } finally {
    client.release();
  }
}

/**
 * DELETE DOCUMENT (WITH CLOUDINARY CLEANUP)
 */
export async function deleteDocumentCore({ category, id }) {
  let table = "";

  if (category === "customer") table = "customer_documents";
  if (category === "guarantor") table = "guarantor_documents";
  if (category === "loan") table = "loan_documents";

  if (!table) throw new Error("Invalid category");

  const { rows } = await pool.query(
    `SELECT public_id FROM ${table} WHERE id = $1`,
    [id],
  );

  const public_id = rows[0]?.public_id;

  if (public_id) {
    await cloudinary.uploader.destroy(public_id);
  }

  await pool.query(`UPDATE ${table} SET is_active = false WHERE id = $1`, [id]);
}
