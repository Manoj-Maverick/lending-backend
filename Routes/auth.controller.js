import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const result = await pool.query(
    `
    SELECT u.id, u.username, u.password_hash, r.role_name, u.branch_id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.username = $1
    AND u.is_active = true
    `,
    [username],
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role_name,
      branchId: user.branch_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  // 🔐 SET COOKIE (KEY CHANGE)
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true });
}

export function logout(req, res) {
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ success: true });
}

export async function getMe(req, res) {
  try {
    // 1️⃣ Read cookie
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded contains: userId, role, branchId
    const { userId, branchId } = decoded;

    // 3️⃣ Fetch user from DB
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        r.role_name AS role,
        u.branch_id AS "branchId"
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      AND u.is_active = true
      `,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    // 4️⃣ Return user info
    res.json(result.rows[0]);
    console.log("Decoded JWT:", result.rows[0], typeof branchId, branchId);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
