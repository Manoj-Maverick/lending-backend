import pool from "../../db.js";

export async function saveStaffSalary(req, res) {
  const {
    employee_id,
    branch_id,
    salary_amount,
    bonus = 0,
    deductions = 0,
    month,
    status = "UNPAID",
    paid_date = null,
  } = req.body;

  if (!employee_id || !branch_id || salary_amount == null || !month) {
    return res.status(400).json({
      success: false,
      message: "employee_id, branch_id, salary_amount, and month are required",
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO staff_salary (
          employee_id,
          branch_id,
          salary_amount,
          bonus,
          deductions,
          month,
          status,
          paid_date,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          to_date($6 || '-01', 'YYYY-MM-DD'),
          $7,
          $8,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (employee_id, month)
        DO UPDATE SET
          branch_id = EXCLUDED.branch_id,
          salary_amount = EXCLUDED.salary_amount,
          bonus = EXCLUDED.bonus,
          deductions = EXCLUDED.deductions,
          status = EXCLUDED.status,
          paid_date = EXCLUDED.paid_date,
          updated_at = CURRENT_TIMESTAMP
        RETURNING
          id,
          employee_id AS "employeeId",
          branch_id AS "branchId",
          salary_amount AS "salaryAmount",
          bonus,
          deductions,
          to_char(month, 'YYYY-MM') AS month,
          status,
          paid_date AS "paidDate",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        employee_id,
        branch_id,
        salary_amount,
        bonus,
        deductions,
        month,
        status,
        paid_date || null,
      ],
    );

    return res.json({
      success: true,
      data: result.rows[0],
      message: "Salary saved successfully",
    });
  } catch (error) {
    console.error("Error saving staff salary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save staff salary",
    });
  }
}
