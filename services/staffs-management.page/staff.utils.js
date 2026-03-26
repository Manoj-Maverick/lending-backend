import bcrypt from "bcrypt";

export const SORT_MAP = {
  name: "e.full_name",
  email: "e.email",
  role: "r.role_name",
  branch: "b.branch_name",
  status: "e.is_active",
  joinDate: "e.join_date",
};

export async function getRoleByName(client, roleName) {
  const roleResult = await client.query(
    "SELECT id, role_name FROM roles WHERE role_name = $1",
    [roleName],
  );

  if (roleResult.rowCount === 0) {
    const error = new Error("Role not found");
    error.statusCode = 400;
    throw error;
  }

  return roleResult.rows[0];
}

export function normalizeStaffPayload(body, { requirePassword = false } = {}) {
  const payload = {
    username: body.username?.trim(),
    password: body.password,
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    address: body.address?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    pincode: body.pincode?.trim() || null,
    designation: body.designation?.trim() || null,
    joinDate: body.joinDate,
    salary:
      body.salary === "" || body.salary == null ? null : Number(body.salary),
    isActive:
      typeof body.isActive === "boolean"
        ? body.isActive
        : String(body.isActive).toLowerCase() !== "false",
    role: body.role?.trim(),
    branchId:
      body.branchId === "" || body.branchId == null ? null : Number(body.branchId),
    dateOfBirth: body.dateOfBirth || null,
    gender: body.gender?.trim() || null,
    alternatePhone: body.alternatePhone?.trim() || null,
    maritalStatus: body.maritalStatus?.trim() || null,
    bloodGroup: body.bloodGroup?.trim() || null,
    emergencyContactName: body.emergencyContactName?.trim() || null,
    emergencyContactPhone: body.emergencyContactPhone?.trim() || null,
    emergencyContactRelationship:
      body.emergencyContactRelationship?.trim() || null,
    fatherName: body.fatherName?.trim() || null,
    motherName: body.motherName?.trim() || null,
    aadhaarNumber: body.aadhaarNumber?.trim() || null,
    panNumber: body.panNumber?.trim() || null,
    bankName: body.bankName?.trim() || null,
    accountHolderName: body.accountHolderName?.trim() || null,
    bankAccountNumber: body.bankAccountNumber?.trim() || null,
    ifscCode: body.ifscCode?.trim() || null,
    accountType: body.accountType?.trim() || null,
    education: body.education?.trim() || null,
    experienceYears:
      body.experienceYears === "" || body.experienceYears == null
        ? null
        : Number(body.experienceYears),
    notes: body.notes?.trim() || null,
  };

  if (!payload.username) {
    const error = new Error("Username is required");
    error.statusCode = 400;
    throw error;
  }

  if (requirePassword && !payload.password) {
    const error = new Error("Password is required");
    error.statusCode = 400;
    throw error;
  }

  if (payload.password && payload.password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.fullName) {
    const error = new Error("Full name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.role) {
    const error = new Error("Role is required");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.joinDate) {
    const error = new Error("Join date is required");
    error.statusCode = 400;
    throw error;
  }

  if (payload.salary != null && Number.isNaN(payload.salary)) {
    const error = new Error("Salary must be a valid number");
    error.statusCode = 400;
    throw error;
  }

  if (payload.experienceYears != null && Number.isNaN(payload.experienceYears)) {
    const error = new Error("Experience years must be a valid number");
    error.statusCode = 400;
    throw error;
  }

  if (payload.role !== "ADMIN" && !payload.branchId) {
    const error = new Error("Branch is required for this role");
    error.statusCode = 400;
    throw error;
  }

  if (payload.role === "ADMIN") {
    payload.branchId = null;
  }

  return payload;
}

export async function ensureBranchExists(client, branchId) {
  if (!branchId) return;

  const branchResult = await client.query(
    "SELECT id FROM branches WHERE id = $1",
    [branchId],
  );

  if (branchResult.rowCount === 0) {
    const error = new Error("Branch not found");
    error.statusCode = 400;
    throw error;
  }
}

export async function generateEmployeeCode(client) {
  const result = await client.query(
    "SELECT COUNT(*)::int AS total FROM employees",
  );
  const nextNumber = result.rows[0].total + 1;
  return `EMP${String(nextNumber).padStart(4, "0")}`;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function upsertStaffDetails(client, employeeId, payload) {
  await client.query(
    `
    INSERT INTO staff_details (
      employee_id,
      date_of_birth,
      gender,
      alternate_phone,
      marital_status,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      father_name,
      mother_name,
      aadhaar_number,
      pan_number,
      bank_name,
      account_holder_name,
      bank_account_number,
      ifsc_code,
      account_type,
      education,
      experience_years,
      notes,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (employee_id)
    DO UPDATE SET
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      alternate_phone = EXCLUDED.alternate_phone,
      marital_status = EXCLUDED.marital_status,
      blood_group = EXCLUDED.blood_group,
      emergency_contact_name = EXCLUDED.emergency_contact_name,
      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
      emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
      father_name = EXCLUDED.father_name,
      mother_name = EXCLUDED.mother_name,
      aadhaar_number = EXCLUDED.aadhaar_number,
      pan_number = EXCLUDED.pan_number,
      bank_name = EXCLUDED.bank_name,
      account_holder_name = EXCLUDED.account_holder_name,
      bank_account_number = EXCLUDED.bank_account_number,
      ifsc_code = EXCLUDED.ifsc_code,
      account_type = EXCLUDED.account_type,
      education = EXCLUDED.education,
      experience_years = EXCLUDED.experience_years,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      employeeId,
      payload.dateOfBirth,
      payload.gender,
      payload.alternatePhone,
      payload.maritalStatus,
      payload.bloodGroup,
      payload.emergencyContactName,
      payload.emergencyContactPhone,
      payload.emergencyContactRelationship,
      payload.fatherName,
      payload.motherName,
      payload.aadhaarNumber,
      payload.panNumber,
      payload.bankName,
      payload.accountHolderName,
      payload.bankAccountNumber,
      payload.ifscCode,
      payload.accountType,
      payload.education,
      payload.experienceYears,
      payload.notes,
    ],
  );
}
