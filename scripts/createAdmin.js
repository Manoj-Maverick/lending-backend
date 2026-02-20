import bcrypt from "bcrypt";
import pool from "../db.js";

async function createAdmin() {
  const fullName = "System Admin";
  const username = "admin";
  const password = "admin123"; // change later
  const roleName = "ADMIN";

  try {
    // 1️⃣ Get role id
    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE role_name = $1",
      [roleName],
    );

    if (roleRes.rowCount === 0) {
      throw new Error("ADMIN role not found");
    }

    const roleId = roleRes.rows[0].id;

    // 2️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3️⃣ Insert user
    await pool.query(
      `
      INSERT INTO users (
        full_name,
        username,
        password_hash,
        role_id,

        branch_id
      )
      VALUES ($1, $2, $3, $4, NULL)
      `,
      [fullName, username, passwordHash, roleId],
    );

    console.log("✅ Admin user created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
    process.exit(1);
  }
}

createAdmin();

async function addUser() {}
