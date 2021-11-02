import { SESSION_COOKIE } from "../constants.js";
import { userNameExists, insertUser } from "../models/users.js";

export function home(request, response) {
  return response.render("home.mustache", {
    username: request.signedCookies[SESSION_COOKIE],
  });
}

export function initiateSignUp(request, response) {
  return response.render("signup.mustache", { message: "Please sign up" });
}

export async function create(request, response) {
  const username = request.body.username;
  if (await userNameExists(username)) {
    return response.send("Username already exists");
  }
  if (await insertUser(username, request.body.password, "normal")) {
    response.cookie(SESSION_COOKIE, username, {
      maxAge: 9000000,
      httpOnly: true,
      signed: true,
    });
    return response.redirect("/home");
  }
  return response.send("Username already exists");
}

export function initiateLogIn(request, response) {
  return response.render("login.mustache", {});
}

export async function createSession(request, response) {
  let username = request.body.username;
  if (await userNameExists(username)) {
    response.cookie(SESSION_COOKIE, username, {
      maxAge: 9000000,
      httpOnly: true,
      signed: true,
    });
    return response.redirect("/home");
  }
  return response.render("login.mustache", {
    message: "Credentials Incorrect.",
  });
}

export function endSession(request, response) {
  response.clearCookie(SESSION_COOKIE);
  response.redirect("/login");
}
