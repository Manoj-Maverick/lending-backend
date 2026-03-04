import pool from "../../db.js";
/**
 * PUT /api/branches/:branchId
 * Purpose: Update branch details (except manager assignment)
 * Expected body: { branch_code, branch_name, address, location, branch_type, state, email, branch_mobile }
 */
export async function updateBranch(req, res) {
  const branchId = Number(req.params.id);
  const {
    branch_name,
    branch_mobile,
    email,
    address,
    location,
    state,
    branch_type,
  } = req.body;

  try {
    await pool.query("SELECT update_branch($1,$2,$3,$4,$5,$6,$7,$8)", [
      branchId,
      branch_name,
      branch_mobile,
      email,
      address,
      location,
      state,
      branch_type,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
