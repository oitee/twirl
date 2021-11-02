import express from "express";
import * as users from "./controllers/users.js";

let router = express.Router();
export default router;

router.get("/", (request, response) => {
  return response.redirect("/login");
});

router.get("/home", users.home);

router.get("/signup", users.initiateSignUp);

router.post("/signup", users.create);

router.get("/login", users.initiateLogIn);

router.post("/login", users.createSession);

router.all("/logout", users.endSession);
