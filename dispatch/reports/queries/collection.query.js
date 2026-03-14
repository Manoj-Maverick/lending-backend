export const TODAY_COLLECTION_QUERY = `
SELECT
    b.id AS branch_id,
    b.branch_name AS branch_name,

    c.id AS customer_id,
    c.full_name AS full_name,
    c.phone AS phone,

    l.id AS loan_id,
    l.loan_code AS loan_code,

    ls.id AS schedule_id,
    ls.installment_no AS installment_no,
    ls.due_amount AS due_amount,
    ls.due_date AS due_date,
    ls.status AS schedule_status

FROM loan_schedule ls

JOIN loans l
    ON l.id = ls.loan_id

JOIN customers c
    ON c.id = l.customer_id

JOIN branches b
    ON b.id = l.branch_id

WHERE
    l.status = 'ACTIVE'
    AND ls.status IN ('PENDING','OVERDUE','DELAYED')
    AND ls.due_date = CURRENT_DATE

ORDER BY
    b.branch_name,
    c.full_name,
    ls.installment_no
`;
