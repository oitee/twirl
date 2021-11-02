import pkg from "pg";
const { Pool } = pkg;
import { PG_CONNECTION_STRING, PG_SSL_CONNECTION } from "../constants.js";

let config = {
  connectionString: PG_CONNECTION_STRING, //'postgres://postgres:password@host:5432/database',
  connectionTimeoutMillis: 60000,
  max: 5,
};
if (PG_SSL_CONNECTION) {
  config.ssl = { rejectUnauthorized: false };
}
export const pool = new Pool(config);
