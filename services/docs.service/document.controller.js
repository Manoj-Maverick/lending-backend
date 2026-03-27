// controllers/document.controller.js
import { uploadDocumentCore, deleteDocumentCore } from "./document.core.js";
import {
  getCustomerDocuments,
  getGuarantorDocuments,
  getLoanDocuments,
  getStaffDocuments,
} from "./document.query.js";

/**
 * Upload document
 */
export async function uploadDocument(req, res) {
  try {
    const {
      category,
      document_type,
      entity_id,
      loan_id,
      file_url,
      public_id,
      file_name,
      mime_type,
      file_size,
    } = req.body;

    if (!category || !document_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🚀 NEW: direct cloud upload flow
    if (file_url && public_id) {
      const doc = await uploadDocumentCore({
        category,
        entity_id: entity_id ? Number(entity_id) : null,
        loan_id: loan_id ? Number(loan_id) : null,
        document_type,
        file: {
          originalname: file_name || "uploaded",
          mimetype: mime_type || "auto",
          size: file_size || 0,
        },
        file_url,
        public_id,
        uploaded_by: req.user?.id || null,
      });

      return res.status(201).json({
        success: true,
        data: doc,
      });
    }

    // fallback (optional)
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const { category } = req.body;
    if (!id || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing id or category",
      });
    }

    await deleteDocumentCore({
      id: Number(id),
      category,
    });

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (err) {
    console.error("Delete failed:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Delete failed",
    });
  }
}

export async function fetchDocuments(req, res) {
  try {
    const { customerId, loanId } = req.query;

    const data = await getAllDocuments(customerId, loanId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchCustomerDocuments(req, res) {
  try {
    const { customerId } = req.params;

    const data = await getCustomerDocuments(customerId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchGuarantorDocuments(req, res) {
  try {
    const { guarantorId } = req.params;

    const data = await getGuarantorDocuments(guarantorId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchLoanDocuments(req, res) {
  try {
    const { loanId } = req.params;

    const data = await getLoanDocuments(loanId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchStaffDocuments(req, res) {
  try {
    const { staffId } = req.params;

    const data = await getStaffDocuments(staffId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
