import db from "../../db.js";

export async function deleteStaff(req, res) {
  const client = await db.connect();

  try {
    const staffId = Number(req.params.staffId);

    await client.query("BEGIN");

    const staffResult = await client.query(
      "SELECT user_id FROM employees WHERE id = $1",
      [staffId],
    );

    if (staffResult.rowCount === 0) {
      const error = new Error("Staff member not found");
      error.statusCode = 404;
      throw error;
    }

    await client.query("UPDATE employees SET is_active = false WHERE id = $1", [
      staffId,
    ]);
    await client.query("UPDATE users SET is_active = false WHERE id = $1", [
      staffResult.rows[0].user_id,
    ]);

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting staff:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to delete staff member",
    });
  } finally {
    client.release();
  }
}
