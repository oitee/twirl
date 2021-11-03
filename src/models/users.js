import { pool } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

export async function validCredentials(username, password) {
  let res = await pool.query(
    "SELECT username from users where username=$1 AND password=$2 limit 1",
    [username, password]
  );
  return res.rows.length > 0;
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
    return true;
  } catch (error) {
    return false;
  } finally {
    client.release();
  }
}
