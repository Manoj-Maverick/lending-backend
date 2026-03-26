import db from "../../db.js";
import {
  ensureBranchExists,
  generateEmployeeCode,
  getRoleByName,
  hashPassword,
  normalizeStaffPayload,
  upsertStaffDetails,
} from "./staff.utils.js";

export async function createStaff(req, res) {
  const client = await db.connect();

  try {
    const payload = normalizeStaffPayload(req.body, { requirePassword: true });
    const role = await getRoleByName(client, payload.role);
    await ensureBranchExists(client, payload.branchId);

    await client.query("BEGIN");

    const userExists = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [payload.username],
    );

    if (userExists.rowCount > 0) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    const userResult = await client.query(
      `
      INSERT INTO users (
        full_name,
        username,
        password_hash,
        plain_password,
        role_id,
        branch_id,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        payload.fullName,
        payload.username,
        await hashPassword(payload.password),
        payload.password,
        role.id,
        payload.branchId,
        payload.isActive,
      ],
    );

    const employeeCode = await generateEmployeeCode(client);

    const employeeResult = await client.query(
      `
      INSERT INTO employees (
        user_id,
        employee_code,
        full_name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        designation,
        join_date,
        salary,
        is_active,
        role_id,
        branch_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
      `,
      [
        userResult.rows[0].id,
        employeeCode,
        payload.fullName,
        payload.phone,
        payload.email,
        payload.address,
        payload.city,
        payload.state,
        payload.pincode,
        payload.designation,
        payload.joinDate,
        payload.salary,
        payload.isActive,
        role.id,
        payload.branchId,
      ],
    );

    await upsertStaffDetails(client, employeeResult.rows[0].id, payload);

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating staff:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to create staff member",
    });
  } finally {
    client.release();
  }
}
