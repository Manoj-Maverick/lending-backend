import bcrypt from "bcrypt";
import pool from "../db.js";

// Settings Functions
export async function loadSettings(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT setting_key, setting_value FROM settings`,
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
}

export async function updateSettings(req, res) {
  const { general, loan, email, security } = req.body;
  const userId = req.user.id;

  try {
    await pool.query("BEGIN");

    const updates = [
      { key: "general", value: general },
      { key: "loan", value: loan },
      { key: "email", value: email },
      { key: "security", value: security },
    ];

    for (const item of updates) {
      await pool.query(
        `
        INSERT INTO settings (setting_key, setting_value, updated_by, updated_at)
        VALUES ($1, $2::jsonb, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key)
        DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_by = EXCLUDED.updated_by,
          updated_at = CURRENT_TIMESTAMP
        `,
        [item.key, JSON.stringify(item.value ?? {}), userId],
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Settings update error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
}

/// User Functions
export async function addUser(req, res) {
  const { name, username, password, role } = req.body;
  console.log("Received addUser request with data:", { name, username, role });
  try {
    // 1️⃣ Get role id
    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE role_name = $1",
      [role],
    );
    if (roleRes.rowCount === 0) {
      return res.status(400).json({ error: "Role not found" });
    }

    const roleId = roleRes.rows[0].id;

    // 2️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

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
      [name, username, passwordHash, roleId],
    );

    res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUsers(req, res) {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.username, r.role_name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.is_active = true
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
