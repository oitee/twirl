import { pool } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

export async function fetchUser(column, value) {
  column = "users." + column;
  let res = await pool.query(
    `SELECT users.*,roles.name AS role from users join roles on users.role_id=roles.id where ${column}=$1 limit 1`,
    [value]
  );
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
}

export async function insertUser(username, password, role) {
  let client = await pool.connect();
  try {
    let res = await client.query("SELECT id FROM roles where name=$1", [role]);
    let roleID = res.rows[0].id;
    let userID = uuidv4();
    await client.query(
      `INSERT INTO users (id, username, password, created_at, role_id) 
                                       values ($1, $2, $3, current_timestamp, $4)`,
      [userID, username, password, roleID]
    );
    return userID;
  } catch (error) {
    return false;
  } finally {
    client.release();
  }
}
