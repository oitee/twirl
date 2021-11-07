import { SESSION_COOKIE, RECAPTCHA_SECRET, ONLY_HTTPS } from "../constants.js";
import { fetchUser as fetchUser, insertUser } from "../models/users.js";
import crypto from "crypto";
import fetch from "node-fetch";

export function home(request, response) {
  return response.render("home.mustache", {
    username: request.twirlUser.username,
  });
}

export function initiateSignUp(request, response) {
  if (homeIfSessionExists(request, response)) {
    return;
  }
  return response.render("signup.mustache", { message: "Please sign up" });
}

export async function create(request, response) {
  if (homeIfSessionExists(request, response)) {
    return;
  }

  if (request.signedCookies[SESSION_COOKIE]) {
    return response.redirect("/home");
  }

  const username = request.body.username;
  if (request.body.password.length < 6) {
    return response.render("signup.mustache", {
      message: "Password too short",
    });
  }

  let isValidCaptcha = await validateCaptcha(request);
  if (!isValidCaptcha) {
    return response.render("signup.mustache", {
      message: "Invalid Captcha",
    });
  }

  const password = hashPassword(request.body.password);
  let userID = await insertUser(username, password, "normal");

  if (userID) {
    response.cookie(SESSION_COOKIE, userID, cookieAtributes());
    return response.redirect("/home");
  }
  return response.render("signup.mustache", {
    message: "Username already exists",
  });
}

export function initiateLogIn(request, response) {
  if (homeIfSessionExists(request, response)) {
    return;
  }
  return response.render("login.mustache", { message: "Please Log In" });
}

export async function createSession(request, response) {
  if (homeIfSessionExists(request, response)) {
    return;
  }
  let username = request.body.username;
  let password = request.body.password;
  let userInDB = await fetchUser("username", username);
  if (!userInDB) {
    return response.render("login.mustache", {
      message: "Credentials Incorrect",
    });
  }
  if (matchPassword(userInDB.password, password)) {
    response.cookie(SESSION_COOKIE, userInDB.id, cookieAtributes());
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

export async function idToUser(userID) {
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

function homeIfSessionExists(request, response) {
  if (request.signedCookies[SESSION_COOKIE]) {
    response.redirect("/home");
    return true;
  }
  return false;
}

async function validateCaptcha(request) {
  if (RECAPTCHA_SECRET == "EXEMPTED") {
    return true;
  }
  let captchaParams = new URLSearchParams();
  captchaParams.append("secret", RECAPTCHA_SECRET);
  captchaParams.append("response", request.body["g-recaptcha-response"]);
  let captchaResponse = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      body: captchaParams,
    }
  ).then((res) => res.json());
  return captchaResponse.success;
}

function cookieAtributes() {
  let attributes = {
    httpOnly: true,
    signed: true,
  };

  if (ONLY_HTTPS) {
    attributes.secure = true;
  }
  return attributes;
}
