import { SESSION_COOKIE } from "../constants.js";
const users = {};

export function home(request, response) {
  return response.render("home.mustache", {
    username: request.signedCookies[SESSION_COOKIE],
  });
}

export function initiateSignUp(request, response) {
  return response.render("signup.mustache", { message: "Please sign up" });
}

export function create(request, response) {
  const username = request.body.username;
  if (users.hasOwnProperty(username)) {
    return response.send("Username already exists");
  }
  users[username] = request.body.password;
  response.cookie(SESSION_COOKIE, username, {
    maxAge: 9000000,
    httpOnly: true,
    signed: true,
  });
  return response.redirect("/home");
}

export function initiateLogIn(request, response) {
  return response.render("login.mustache", {});
}

export function createSession(request, response) {
  let username = request.body.username;
  if (users.hasOwnProperty(username)) {
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
