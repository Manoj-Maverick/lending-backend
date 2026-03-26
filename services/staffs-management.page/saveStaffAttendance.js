import db from "../../db.js";

export async function saveStaffAttendance(req, res) {
  try {
    const staffId = Number(req.params.staffId);
    const {
      attendanceDate,
      checkInTime = null,
      checkOutTime = null,
      status = "PRESENT",
      notes = null,
    } = req.body;

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    const result = await db.query(
      `
      INSERT INTO staff_attendance (
        employee_id,
        attendance_date,
        check_in_time,
        check_out_time,
        status,
        notes,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        employee_id AS "employeeId",
        attendance_date AS "attendanceDate",
        check_in_time AS "checkInTime",
        check_out_time AS "checkOutTime",
        status,
        notes
      `,
      [staffId, attendanceDate, checkInTime, checkOutTime, status, notes],
    );

    return res.json({
      success: true,
      data: result.rows[0],
      message: "Attendance saved successfully",
    });
  } catch (err) {
    console.error("Error saving staff attendance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save attendance",
    });
  }
}
