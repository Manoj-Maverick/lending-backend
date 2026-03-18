import pool from "../db.js";
export async function getCustomerDocuments(customer_id) {
  const { rows } = await pool.query(
    `SELECT id, document_type AS type, file_name AS name,
            file_url AS url, file_size AS size, uploaded_at
     FROM customer_documents
     WHERE customer_id = $1 AND is_active = true`,
    [customer_id],
  );

  return rows;
}

export async function getGuarantorDocuments(guarantor_id) {
  const { rows } = await pool.query(
    `SELECT id, document_type AS type, file_name AS name,
            file_url AS url, file_size AS size, uploaded_at
     FROM guarantor_documents
     WHERE guarantor_id = $1 AND is_active = true`,
    [guarantor_id],
  );

  return rows;
}

export async function getLoanDocuments(loan_id) {
  const { rows } = await pool.query(
    `SELECT id, document_type AS type, file_name AS name,
            file_url AS url, file_size AS size, uploaded_at
     FROM loan_documents
     WHERE loan_id = $1 AND is_active = true`,
    [loan_id],
  );

  return rows;
}
