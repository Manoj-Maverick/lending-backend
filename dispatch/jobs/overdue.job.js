import db from "../../db.js";

export async function overdueChecker() {
  console.log("Running overdue checker...");

  const query = `
    UPDATE loan_schedule ls
    SET status = 'OVERDUE'
    FROM loans l
    WHERE ls.loan_id = l.id
    AND ls.status = 'PENDING'
    AND ls.due_date < CURRENT_DATE
    RETURNING ls.id
  `;

  const { rows } = await db.query(query);

  console.log(`Overdue installments: ${rows.length}`);
}
