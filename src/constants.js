import pathToReg from "path-to-regexp";

const baseRoutes = [
  ["ANY", "/signup"],
  ["ANY", "/login"],
  ["GET", "/l/:id"],
];
export const UNAUTHENTICATED_ROUTE_MATCHERS = baseRoutes.map(
  ([method, route]) => {
    let reg = pathToReg(route);
    return (request) => {
      if (!reg.exec(request.path)) return false;
      if (method === "ANY") return true;
      return request.method === method;
    };
  }
);

export const SESSION_COOKIE = "_twirl";
export const PG_CONNECTION_STRING = process.env.PG_CONNECTION_STRING;
export const PG_SSL_CONNECTION = process.env.PG_SSL_CONNECTION === "true";

export const COOKIE_SECRET = process.env.COOKIE_SECRET;

export const PORT_NUMBER = parseInt(process.env.PORT || "80");

export const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

export const ONLY_HTTPS = process.env.ONLY_HTTPS === "true"; 