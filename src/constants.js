import pathToReg from "path-to-regexp";

const baseRouts = ["/signup", "/login"];
export const UNAUTHENTICATED_ROUTES = baseRouts.map((route) =>
  pathToReg(route)
);
