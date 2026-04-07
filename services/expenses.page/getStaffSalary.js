import pool from "../../db.js";

export async function getStaffSalary(req, res) {
  let {
    branch_id = null,
    role = "all",
    employee_id = null,
    month = null,
  } = req.query;

  branch_id = !branch_id || branch_id === "all" ? null : Number(branch_id);
  employee_id =
    !employee_id || employee_id === "all" ? null : Number(employee_id);
  role = !role || role === "all" ? null : role;
  month = month || new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(
      `
        SELECT
          ss.id,
          ss.employee_id AS "employeeId",
          e.full_name AS "employeeName",
          e.employee_code AS "employeeCode",
          r.role_name AS role,
          b.id AS "branchId",
          b.branch_name AS branch,
          ss.salary_amount AS "salaryAmount",
          ss.bonus,
          ss.deductions,
          (ss.salary_amount + ss.bonus - ss.deductions) AS "netAmount",
          to_char(ss.month, 'YYYY-MM') AS month,
          ss.status,
          ss.paid_date AS "paidDate",
          ss.created_at AS "createdAt",
          ss.updated_at AS "updatedAt"
        FROM staff_salary ss
        JOIN employees e ON e.id = ss.employee_id
        JOIN users u ON u.id = e.user_id
        JOIN roles r ON r.id = u.role_id
        LEFT JOIN branches b ON b.id = ss.branch_id
        WHERE ($1::int IS NULL OR ss.branch_id = $1)
          AND ($2::text IS NULL OR r.role_name = $2)
          AND ($3::int IS NULL OR ss.employee_id = $3)
          AND to_char(ss.month, 'YYYY-MM') = $4
        ORDER BY e.full_name ASC
      `,
      [branch_id, role, employee_id, month],
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching staff salary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff salary",
    });
  }
}
