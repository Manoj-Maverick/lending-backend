import db from "../../db.js";

export async function getStaffDetail(req, res) {
  try {
    const staffId = Number(req.params.staffId);

    const result = await db.query(
      `
      SELECT
        e.id,
        e.user_id AS "userId",
        e.employee_code AS code,
        e.full_name AS name,
        u.username,
        e.email,
        e.phone,
        e.address,
        e.city,
        e.state,
        e.pincode,
        e.designation,
        e.salary,
        e.join_date AS "joinDate",
        e.is_active AS status,
        r.role_name AS role,
        b.id AS "branchId",
        b.branch_name AS branch,
        sd.date_of_birth AS "dateOfBirth",
        sd.gender,
        sd.alternate_phone AS "alternatePhone",
        sd.marital_status AS "maritalStatus",
        sd.blood_group AS "bloodGroup",
        sd.emergency_contact_name AS "emergencyContactName",
        sd.emergency_contact_phone AS "emergencyContactPhone",
        sd.emergency_contact_relationship AS "emergencyContactRelationship",
        sd.father_name AS "fatherName",
        sd.mother_name AS "motherName",
        sd.aadhaar_number AS "aadhaarNumber",
        sd.pan_number AS "panNumber",
        sd.bank_name AS "bankName",
        sd.account_holder_name AS "accountHolderName",
        sd.bank_account_number AS "bankAccountNumber",
        sd.ifsc_code AS "ifscCode",
        sd.account_type AS "accountType",
        sd.education,
        sd.experience_years AS "experienceYears",
        sd.notes,
        COALESCE(attendance.present_days, 0) AS "presentDays",
        COALESCE(attendance.absent_days, 0) AS "absentDays",
        COALESCE(attendance.leave_days, 0) AS "leaveDays"
      FROM employees e
      JOIN users u ON u.id = e.user_id
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN branches b ON b.id = e.branch_id
      LEFT JOIN staff_details sd ON sd.employee_id = e.id
      LEFT JOIN (
        SELECT
          employee_id,
          COUNT(*) FILTER (WHERE status = 'PRESENT') AS present_days,
          COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent_days,
          COUNT(*) FILTER (WHERE status = 'LEAVE') AS leave_days
        FROM staff_attendance
        GROUP BY employee_id
      ) attendance ON attendance.employee_id = e.id
      WHERE e.id = $1
      `,
      [staffId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching staff detail:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff detail",
    });
  }
}
