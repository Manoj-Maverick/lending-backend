import db from "../../db.js";
import { SORT_MAP } from "./staff.utils.js";

/**
 * GET /api/staff
 * Query params:
 *  - search
 *  - branch
 *  - role
 *  - sortKey
 *  - sortDir (asc|desc)
 *  - page
 *  - pageSize
 */
export async function getStaffsList(req, res) {
  const {
    search = "",
    branch = "all",
    role = "all",
    sortKey = "name",
    sortDir = "asc",
    page = 1,
    pageSize = 10,
  } = req.query;
  const limit = Math.max(Number(pageSize), 1);
  const offset = (Math.max(Number(page), 1) - 1) * limit;

  const params = [];
  const whereClauses = [];
  let idx = 1;

  if (search && search.trim() !== "") {
    params.push(`%${search}%`);
    whereClauses.push(`
      (
        e.full_name ILIKE $${idx}
        OR e.email ILIKE $${idx}
        OR e.phone ILIKE $${idx}
        OR e.employee_code ILIKE $${idx}
      )
    `);
    idx++;
  }

  if (branch !== "all") {
    params.push(Number(branch));
    whereClauses.push(`b.id = $${idx++}`);
  }

  if (role !== "all") {
    params.push(role);
    whereClauses.push(`r.role_name = $${idx++}`);
  }

  whereClauses.unshift(`r.role_name <> 'ADMIN'`);

  const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

  const orderByCol = SORT_MAP[sortKey] || "e.full_name";
  const orderDir = sortDir?.toLowerCase() === "desc" ? "DESC" : "ASC";

  const listQuery = `
    SELECT
      e.id,
      e.user_id AS "userId",
      e.employee_code AS code,
      e.full_name AS name,
      u.username,
      e.email,
      e.phone,
      e.address,
      e.city,
      e.state,
      e.pincode,
      e.designation,
      e.salary,
      r.role_name AS role,
      b.id AS "branchId",
      b.branch_name AS branch,
      e.is_active AS status,
      e.join_date AS "joinDate",
      sd.date_of_birth AS "dateOfBirth",
      sd.gender,
      sd.alternate_phone AS "alternatePhone",
      sd.marital_status AS "maritalStatus",
      sd.blood_group AS "bloodGroup",
      sd.emergency_contact_name AS "emergencyContactName",
      sd.emergency_contact_phone AS "emergencyContactPhone",
      sd.emergency_contact_relationship AS "emergencyContactRelationship",
      sd.father_name AS "fatherName",
      sd.mother_name AS "motherName",
      sd.aadhaar_number AS "aadhaarNumber",
      sd.pan_number AS "panNumber",
      sd.bank_name AS "bankName",
      sd.account_holder_name AS "accountHolderName",
      sd.bank_account_number AS "bankAccountNumber",
      sd.ifsc_code AS "ifscCode",
      sd.account_type AS "accountType",
      sd.education,
      sd.experience_years AS "experienceYears",
      sd.notes,
      photo.file_url AS photo
    FROM employees e
    JOIN users u ON u.id = e.user_id
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN staff_details sd ON sd.employee_id = e.id
    LEFT JOIN LATERAL (
      SELECT file_url
      FROM staff_documents
      WHERE employee_id = e.id
        AND document_type = 'PHOTO'
        AND is_active = TRUE
      ORDER BY uploaded_at DESC, id DESC
      LIMIT 1
    ) photo ON TRUE
    ${whereSQL}
    ORDER BY ${orderByCol} ${orderDir}
    LIMIT $${idx} OFFSET $${idx + 1};
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM employees e
    JOIN users u ON u.id = e.user_id
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${whereSQL};
  `;

  try {
    const listParams = [...params, limit, offset];

    const [listResult, countResult] = await Promise.all([
      db.query(listQuery, listParams),
      db.query(countQuery, params),
    ]);

    return res.json({
      success: true,
      data: listResult.rows,
      pagination: {
        page: Number(page),
        pageSize: limit,
        total: countResult.rows[0].total,
      },
    });
  } catch (err) {
    console.error("Error fetching staff list:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff list",
    });
  }
}
