import pathToReg from "path-to-regexp";

const baseRouts = ["/signup", "/login"];
export const UNAUTHENTICATED_ROUTES = baseRouts.map((route) =>
  pathToReg(route)
);

export const SESSION_COOKIE = "_twirl";
export const PG_CONNECTION_STRING = process.env.PG_CONNECTION_STRING;
export const PG_SSL_CONNECTION = process.env.PG_SSL_CONNECTION === "true";

export const COOKIE_SECRET = process.env.COOKIE_SECRET;
