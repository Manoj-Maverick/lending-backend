import db from "../../db.js";
import {
  ensureBranchExists,
  getRoleByName,
  hashPassword,
  normalizeStaffPayload,
  upsertStaffDetails,
} from "./staff.utils.js";

export async function updateStaff(req, res) {
  const client = await db.connect();

  try {
    const staffId = Number(req.params.staffId);
    const payload = normalizeStaffPayload(req.body);
    const role = await getRoleByName(client, payload.role);
    await ensureBranchExists(client, payload.branchId);

    await client.query("BEGIN");

    const staffResult = await client.query(
      `
      SELECT e.id, e.user_id
      FROM employees e
      WHERE e.id = $1
      `,
      [staffId],
    );

    if (staffResult.rowCount === 0) {
      const error = new Error("Staff member not found");
      error.statusCode = 404;
      throw error;
    }

    const currentStaff = staffResult.rows[0];

    const userExists = await client.query(
      "SELECT id FROM users WHERE username = $1 AND id <> $2",
      [payload.username, currentStaff.user_id],
    );

    if (userExists.rowCount > 0) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    const userParams = [
      payload.fullName,
      payload.username,
      role.id,
      payload.branchId,
      payload.isActive,
      currentStaff.user_id,
    ];
    let passwordClause = "";

    if (payload.password) {
      userParams.splice(
        2,
        0,
        await hashPassword(payload.password),
        payload.password,
      );
      passwordClause = ", password_hash = $3, plain_password = $4";
    }

    await client.query(
      `
      UPDATE users
      SET
        full_name = $1,
        username = $2
        ${passwordClause},
        role_id = $${payload.password ? 5 : 3},
        branch_id = $${payload.password ? 6 : 4},
        is_active = $${payload.password ? 7 : 5}
      WHERE id = $${payload.password ? 8 : 6}
      `,
      userParams,
    );

    await client.query(
      `
      UPDATE employees
      SET
        full_name = $1,
        phone = $2,
        email = $3,
        address = $4,
        city = $5,
        state = $6,
        pincode = $7,
        designation = $8,
        join_date = $9,
        salary = $10,
        is_active = $11,
        role_id = $12,
        branch_id = $13
      WHERE id = $14
      `,
      [
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
        staffId,
      ],
    );

    await upsertStaffDetails(client, staffId, payload);

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Staff member updated successfully",
      data: {
        id: staffId,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating staff:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to update staff member",
    });
  } finally {
    client.release();
  }
}
