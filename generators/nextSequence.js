import pool from "../db.js";

export async function getNextSequence(key) {
  const result = await pool.query(
    `
    INSERT INTO code_sequences(key, current_value)
    VALUES ($1, 1)
    ON CONFLICT (key)
    DO UPDATE SET current_value = code_sequences.current_value + 1
    RETURNING current_value
    `,
    [key],
  );

  return result.rows[0].current_value;
}
