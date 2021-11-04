import { pool } from "../db/connection.js";
import { createHash } from "crypto";

export async function incrementCounter() {
  let res = await pool.query(
    "UPDATE counters SET value=value+1 WHERE id='link_counter' RETURNING value"
  );
  return res.rows[0].value;
}

export async function addShortenedLink(userID, longLink, shortLink) {
  try {
    await pool.query(
      `INSERT INTO links 
      (user_id, original_link, short_link, created_at, updated_at) 
      values ($1, $2, $3, current_timestamp, current_timestamp)`,
      [userID, longLink, shortLink]
    );
    return true;
  } catch (e) {
    return false;
  }
}

export async function fetchShortLink(userID, longLink) {
  let res = await pool.query(
    "SELECT short_link from links WHERE original_link=$1 AND user_id=$2 LIMIT 1",
    [longLink, userID]
  );
  if (res.rows.length > 0) {
    return res.rows[0]["short_link"];
  }
  return false;
}

export async function fetchLongLink(shortLink) {
  let client = await pool.connect();
  try {
    let res = await client.query(
      `SELECT original_link FROM links 
      WHERE short_link=$1 AND enabled='t' LIMIT 1`,
      [shortLink]
    );
    if (res.rows.length > 0) {
      await client.query(
        `UPDATE links SET accessed_count=accessed_count+1 
        where short_link=$1 AND enabled='t'`,
        [shortLink]
      );
      return res.rows[0]["original_link"];
    }
    return false;
  } finally {
    client.release();
  }
}

export async function fetchAnalytics(userID) {
  let res = await pool.query(
    `SELECT original_link, short_link, accessed_count, enabled FROM links 
  WHERE user_id=$1 
  ORDER BY accessed_count DESC, created_at DESC limit 50;`,
    [userID]
  );
  return res.rows;
}
