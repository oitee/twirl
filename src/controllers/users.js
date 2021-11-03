import { SESSION_COOKIE } from "../constants.js";
import { fetchUser as fetchUser, insertUser } from "../models/users.js";
import crypto from "crypto";

export function home(request, response) {
  return response.render("home.mustache", {
    
    username: request.twirlUser.username,
  });
}

export function initiateSignUp(request, response) {
  return response.render("signup.mustache", { message: "Please sign up" });
}

export async function create(request, response) {
  const username = request.body.username;
  const password = hashPassword(request.body.password);
  let userID = await insertUser(username, password, "normal");
  if (userID) {
    response.cookie(SESSION_COOKIE, userID, {
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
  let password = request.body.password;
  let userInDB = await fetchUser("username", username);
  if (!userInDB) {
    return response.render("login.mustache", {
      message: "Credentials Incorrect.",
    });
  }
  if (matchPassword(userInDB.password, password)) {
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

export async function idToUser(userID){
  return await fetchUser("id", userID);
}

function pbkdf2(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100, 64, "sha512")
    .toString("base64");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64");
  const hashedPassword = pbkdf2(password, salt);
  return hashedPassword + ":" + salt;
}

export function matchPassword(dbPassword, enteredPassword) {
  let [hashedPassword, salt] = dbPassword.split(":");
  return hashedPassword === pbkdf2(enteredPassword, salt);
}
