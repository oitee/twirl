import pathToReg from "path-to-regexp";

const baseRouts = ["/signup", "/login"];
export const UNAUTHENTICATED_ROUTES = baseRouts.map((route) =>
  pathToReg(route)
);

export const SESSION_COOKIE = "_twirl";

export const COOKIE_SECRET = process.env.COOKIE_SECRET;