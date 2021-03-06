import express from "express";
import * as users from "./controllers/users.js";
import * as links from "./controllers/links.js";
import { UNAUTHENTICATED_ROUTE_MATCHERS, SESSION_COOKIE, ONLY_HTTPS } from "./constants.js";
let router = express.Router();
export default router;

router.use(redirectIfNotHTTPS, auth);

async function auth(request, response, next) {
  if (
    UNAUTHENTICATED_ROUTE_MATCHERS.some((routeMatcher) => routeMatcher(request))
  ) {
    return next();
  }
  if (!request.signedCookies[SESSION_COOKIE]) {
    return response.redirect("/login");
  }
  request.twirlUser = await users.idToUser(
    request.signedCookies[SESSION_COOKIE]
  );
  delete request.twirlUser.password;
  next();
}

function redirectIfNotHTTPS(request, response, next){
  if(request.headers["x-forwarded-proto"] !== "https" && ONLY_HTTPS){
    return response.redirect("https://" + request.hostname + request.originalUrl);
  }
  return next();
}

router.get("/", (request, response) => response.redirect("/home"));

router.post("/l/shorten", links.shorten);

router.post("/l/disable/:id", links.disableLink);

router.post("/l/enable/:id", links.enableLink);

router.get("/l/:id", links.goToLink);

router.get("/analytics", links.analytics);

router.get("/home", users.home);

router.get("/signup", users.initiateSignUp);

router.post("/signup", users.create);

router.get("/login", users.initiateLogIn);

router.post("/login", users.createSession);

router.all("/logout", users.endSession);
