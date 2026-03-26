import db from "../../db.js";

export async function getStaffAttendance(req, res) {
  try {
    const staffId = Number(req.params.staffId);
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const result = await db.query(
      `
      SELECT
        id,
        employee_id AS "employeeId",
        attendance_date AS "attendanceDate",
        check_in_time AS "checkInTime",
        check_out_time AS "checkOutTime",
        status,
        notes
      FROM staff_attendance
      WHERE employee_id = $1
      AND to_char(attendance_date, 'YYYY-MM') = $2
      ORDER BY attendance_date DESC
      `,
      [staffId, month],
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("Error fetching staff attendance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
}
