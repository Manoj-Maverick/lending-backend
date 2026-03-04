import pool from "../../db.js";

/**
 * POST /api/branchesS
 * Branch Management - CREATE
 * Expected body: { branch_code, branch_name, address, location, branch_type }
 * Returns: { success: boolean, branch: {...} }
 */
export async function createBranch(req, res) {
  const {
    code,
    name,
    phone,
    email,
    address,
    city, // this will go to location
    state,
    zipCode,
    branchType,
  } = req.body;

  try {
    const result = await pool.query(
      `SELECT create_branch($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        code,
        name,
        phone,
        email,
        address,
        city, // location
        state,
        zipCode,
        branchType,
      ],
    );

    return res.status(201).json({
      message: "Branch created successfully",
      branchId: result.rows[0].create_branch,
    });
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err.message,
    });
  }
}
