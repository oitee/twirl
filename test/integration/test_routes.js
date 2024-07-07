import launch from "../../src/server.js";
import assert from "assert";
import express from "express";
import fetch from "node-fetch";
import cookie from "cookie";
import { SESSION_COOKIE } from "../../src/constants.js";
import { pool, poolStart } from "../../src/db/connection.js";

let port, server, baseUrl;

function freePort() {
  const testApp = express();
  const testServer = testApp.listen(0);
  const port = testServer.address().port;
  testServer.close();
  return port;
}

async function basicRouteTests(port) {
  let response;
  // -----------------------------------------------------------------
  // GET /
  // -----------------------------------------------------------------
  response = await fetch(baseUrl, {
    method: "GET",
    redirect: "manual",
  });
  assert(response.status === 302, "GET / status is 302");
  assert(response.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET /login
  // -----------------------------------------------------------------
  let redirectResponse = await fetch(response.headers.get("location"), {
    method: "GET",
    redirect: "manual",
  });
  assert(redirectResponse.status === 200, "GET /login status is 200");
  let responseBody = await redirectResponse.text();
  assert(
    responseBody.includes(`<title>Twirl | Log-in</title>`),
    "GET /login returns the correct page"
  );
  assert(redirectResponse.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /login (with non-existing credentials)
  // -----------------------------------------------------------------
  let parameters = new URLSearchParams();
  parameters.append("username", "user1");
  parameters.append("password", "1234567");
  let loginResponse = await fetch(`${baseUrl}/login`, {
    method: "POST",
    body: parameters,
  });
  assert.equal(
    loginResponse.status,
    200,
    "POST /login with wrong credentials, returns status 200"
  );
  assert(
    (await loginResponse.text()).includes("Credentials Incorrect"),
    "POST /login body contains incorrect credentials message"
  );
  assert(loginResponse.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /signup
  // -----------------------------------------------------------------
  const signUpResponse = await fetch(`${baseUrl}/signup`, {
    method: "POST",
    body: parameters,
    redirect: "manual",
  });
  assert.equal(
    signUpResponse.status,
    302,
    "POST /signup returns with status 302"
  );
  const responseRedirectHome = await fetch(
    signUpResponse.headers.get("location"),
    {
      method: "GET",
      headers: extractSessionCookie(signUpResponse),
      redirect: "manual",
    }
  );
  assert(
    (await responseRedirectHome.text()).includes("<title>Twirl | Home</title>"),
    "GET /home (redirect); body should contain correct title"
  );
  assert.equal(
    responseRedirectHome.status,
    200,
    "GET /home (redirect); status should be 200"
  );
  assert(responseRedirectHome.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /signup WITH SHORT PASSWORD
  // -----------------------------------------------------------------
  let parametersShortPassword = new URLSearchParams();
  parametersShortPassword.append("username", "Sukumar");
  parametersShortPassword.append("password", "Ray");
  const signUpResponseShortPassword = await fetch(`${baseUrl}/signup`, {
    method: "POST",
    body: parametersShortPassword,
    redirect: "manual",
  });
  assert(
    (await signUpResponseShortPassword.text()).includes(
      "Password too short"
    ),
    "POST /sign up with short password should return error message"
  );
  assert(signUpResponseShortPassword.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /login (with correct credentials)
  // -----------------------------------------------------------------

  let logInResponseCorrect = await fetch(`${baseUrl}/login`, {
    method: "POST",
    body: parameters,
    redirect: "manual",
  });
  assert.equal(
    logInResponseCorrect.status,
    302,
    "POST /login with existing credentials, returns status 200"
  );

  let location = logInResponseCorrect.headers.get("location");
  response = await await fetch(location, {
    method: "GET",
    redirect: "manual",
    headers: extractSessionCookie(logInResponseCorrect),
  });
  assert.equal(
    response.status,
    200,
    "GET /home, after redirection from login, returns status 200"
  );
  assert(
    (await response.text()).includes("Welcome, user1"),
    "GET /home, after redirection from login, body contains username"
  );
  assert.equal(
    response.headers.get("set-cookie"),
    undefined,
    "GET /home after redirection from login, contains no set-cookie header"
  );

  // -----------------------------------------------------------------
  // GET /login with already signed user
  // -----------------------------------------------------------------

  let responseLogIn = await fetch(`${baseUrl}/login`, {
    method: "GET",
    headers: extractSessionCookie(signUpResponse),
    redirect: "manual",
  });
  assert.equal(
    responseLogIn.status,
    302,
    "GET /login (with already signed user); status should be 302"
  );
  assert(
    responseLogIn.headers.get("location"),
    `${baseUrl}/home`,
    "GET /login (with already signed in User); redirect location: home page"
  );
  assert(responseLogIn.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /login with invalid password
  // -----------------------------------------------------------------

  let invalidParameters = new URLSearchParams();
  invalidParameters.append("username", "user1");
  invalidParameters.append("password", "invalid");
  response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    redirect: "manual",
    body: invalidParameters,
  });
  assert.equal(
    response.status,
    200,
    "POST /login (with incorrect password); status should be 200"
  );
  assert((await response.text()).includes("Credentials Incorrect"));
  assert(response.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET /home with already signed user
  // -----------------------------------------------------------------

  response = await fetch(`${baseUrl}/home`, {
    method: "GET",
    headers: extractSessionCookie(signUpResponse),
    redirect: "manual",
  });
  assert.equal(
    response.status,
    200,
    "GET /home (with already signed user); status should be 200"
  );
  assert((await response.text()).includes(`Welcome, user1`));
  assert(response.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET /signup with already signed user
  // -----------------------------------------------------------------

  let responseSignUp = await fetch(`${baseUrl}/signup`, {
    method: "GET",
    headers: extractSessionCookie(signUpResponse),
    redirect: "manual",
  });
  assert.equal(
    responseSignUp.status,
    302,
    "GET /signup (with already signed user); status should be 302"
  );
  assert(
    responseSignUp.headers.get("location"),
    `${baseUrl}/home`,
    "GET /signup (with already signed in User); redirect location: home page"
  );
  assert(responseSignUp.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST  /signup with already signed user
  // -----------------------------------------------------------------

  responseSignUp = await fetch(`${baseUrl}/signup`, {
    method: "POST",
    headers: extractSessionCookie(signUpResponse),
    redirect: "manual",
  });
  assert(responseSignUp.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET  /logout
  // -----------------------------------------------------------------

  let responseLogOut = await fetch(`${baseUrl}/logout`, {
    method: "GET",
    headers: extractSessionCookie(signUpResponse),
    redirect: "manual",
  });
  let cookieObj = cookie.parse(responseLogOut.headers.get("set-cookie"));
  assert(
    cookieObj.hasOwnProperty(SESSION_COOKIE),
    "GET /logout response should not contain value of cookie"
  );
  assert(
    cookieObj["Expires"] === "Thu, 01 Jan 1970 00:00:00 GMT",
    "GET /logout response should set new cookie dated to UNIX epoch"
  );

  // -----------------------------------------------------------------
  // POST /signup with already existing username
  // -----------------------------------------------------------------
  response = await fetch(`${baseUrl}/signup`, {
    method: "POST",
    redirect: "manual",
    body: parameters,
  });
  assert(
    (await response.text()).includes("Username already exists"),
    "POST /signup with existing username. Body should contain error message"
  );
  assert.equal(
    response.status,
    200,
    "POST /signup with already existing username; status should be 200"
  );
  assert(responseLogIn.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // POST /l/shorten WITHOUT LOG-IN
  // -----------------------------------------------------------------

  let link4 = "https://stackoverflow.com/";
  await assertNoAccessWithoutSession(
    "POST",
    "/l/shorten",
    { "content-type": "application/json" },
    JSON.stringify({ originalLink: link4 })
  );
  // let res = await fetch(`${baseUrl}/l/shorten`, {
  //   method: "POST",
  //   redirect: "manual",
  //   headers: { "content-type": "application/json" },
  //   body: JSON.stringify({ originalLink: link4 }),
  // });
  // assert.equal(res.status, 302, "User cannot create link without signing in");
  // assert(res.headers.get("set-cookie") == undefined);
  // -----------------------------------------------------------------
  // POST /l/shortLink WITH LOGGED IN USER
  // -----------------------------------------------------------------

  let res = await fetch(`${baseUrl}/l/shorten`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...extractSessionCookie(signUpResponse),
    },
    body: JSON.stringify({ originalLink: link4 }),
  });
  let resBody = await res.json();
  assert(
    resBody.status,
    "Link should be successfully shortened for a logged-in user"
  );
  assert.equal(res.status, 200, "Logged-in user can create link");
  assert(res.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET /l/shortLink WITH NO SESSION
  // -----------------------------------------------------------------
  let expansionRes = await fetch(`${baseUrl}${resBody.shortLinkPath}`, {
    method: "GET",
    redirect: "manual",
  });

  assert.equal(
    expansionRes.status,
    302,
    "Valid shortened link should be redirected"
  );
  assert.equal(
    expansionRes.headers.get("location"),
    link4,
    "Check if the expanded link is correct, when there is no session"
  );

  // -----------------------------------------------------------------
  // GET /l/shortLink WITH SESSION
  // -----------------------------------------------------------------

  expansionRes = await fetch(`${baseUrl}${resBody.shortLinkPath}`, {
    method: "GET",
    redirect: "manual",
    headers: extractSessionCookie(signUpResponse),
  });

  assert.equal(
    expansionRes.status,
    302,
    "Valid shortened link should be redirected"
  );
  assert.equal(
    expansionRes.headers.get("location"),
    link4,
    "Check if the expanded link is correct, when there is a session"
  );

  // -----------------------------------------------------------------
  // TESTS FOR AUTHENTICATED ROUTE ACCESS
  // -----------------------------------------------------------------

  await assertNoAccessWithoutSession("POST", "/analytics");

  await assertNoAccessWithoutSession("POST", `/l/disable/1234`);
}

beforeAll(async () => {
  poolStart();
  await pool.query(`
  DROP TABLE IF EXISTS counters;
  DROP TABLE IF EXISTS links;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS roles;
  CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT);
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    role_id INTEGER REFERENCES roles (id));
  INSERT INTO roles (name) values ('admin') , ('normal'), ('superAdmin');
  CREATE TABLE counters(
    id TEXT PRIMARY KEY,
    value INTEGER  
);
  INSERT INTO counters (id, value) values ('link_counter', 0);
  UPDATE counters SET value=value+1 WHERE id='link_counter' RETURNING value;

  CREATE TABLE links (
    user_id UUID REFERENCES users (id),
    original_link TEXT NOT NULL,
    short_link TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 'true',
    accessed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, original_link)
);
 ALTER TABLE users ADD status TEXT;
 ALTER TABLE users ALTER COLUMN status SET DEFAULT 'unverified';
 UPDATE users SET status='unverified';`);

  port = freePort();
  server = launch(port);
  baseUrl = `http://localhost:${port}`;
});
afterAll(async () => {
  server.close();
  await pool.end();
});

test("Basic router tests", () => basicRouteTests(port));

function extractSessionCookie(response) {
  let stringCookie = response.headers.get("set-cookie");
  let cookieObj = cookie.parse(stringCookie);
  let cookieHeader = `${SESSION_COOKIE}=${cookieObj[SESSION_COOKIE]}`;
  return { Cookie: cookieHeader };
}

async function assertNoAccessWithoutSession(method, path, extraHeaders, body) {
  let requestObject = {
    method: method,
    redirect: "manual",
  };
  if (extraHeaders) {
    requestObject.headers = extraHeaders;
  }
  if (body) {
    requestObject.body = body;
  }

  let res = await fetch(`${baseUrl}${path}`, requestObject);
  assert.equal(res.status, 302, `User cannot accesss ${path} without session`);
  assert(res.headers.get("set-cookie") == undefined);
}
