import express from "express";
import * as users from "./controllers/users.js";
import { UNAUTHENTICATED_ROUTES } from "./constants.js";
let router = express.Router();
export default router;

router.use(auth);

function auth(request, response, next) {
  if (
    UNAUTHENTICATED_ROUTES.some((routeRegEx) => routeRegEx.exec(request.path))
  ) {
    if (request.cookies["_twirl"]) {
      return response.redirect("/home");
    }
    return next();
  }
  if (!request.cookies["_twirl"]) {
    return response.redirect("/login");
  }
  return next();
}

router.get("/", (request, response) => response.redirect("/home"));

router.get("/home", users.home);

router.get("/signup", users.initiateSignUp);

router.post("/signup", users.create);

router.get("/login", users.initiateLogIn);

router.post("/login", users.createSession);

router.all("/logout", users.endSession);
