import launch from "../../src/server.js";
import assert from "assert";
import express from "express";
import fetch from "node-fetch";
import cookie from "cookie";

function freePort() {
  const testApp = express();
  const testServer = testApp.listen(0);
  const port = testServer.address().port;
  testServer.close();
  return port;
}

async function basicRouteTests(port) {
  let baseUrl = `http://localhost:${port}`;
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
  parameters.append("password", "123");
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
  let signUpResponse = await fetch(`${baseUrl}/signup`, {
    method: "POST",
    body: parameters,
    redirect: "manual",
  });
  assert.equal(
    signUpResponse.status,
    302,
    "POST /signup returns with status 302"
  );
  let stringCookie = signUpResponse.headers.get("set-cookie");
  let cookieObj = cookie.parse(stringCookie);
  let signUpResponseCookieHeader = `_twirl=${cookieObj["_twirl"]}`;
  console.log(signUpResponse.headers.get("location"));
  let responseRedirectHome = await fetch(
    signUpResponse.headers.get("location"),
    {
      method: "GET",
      headers: { Cookie: signUpResponseCookieHeader },
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
  // GET /login with already signed user
  // -----------------------------------------------------------------

  let responseLogIn = await fetch(`${baseUrl}/login`, {
    method: "GET",
    headers: { Cookie: signUpResponseCookieHeader },
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
  // GET /home with already signed user
  // -----------------------------------------------------------------

  response = await fetch(`${baseUrl}/home`, {
    method: "GET",
    headers: { Cookie: signUpResponseCookieHeader },
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
    headers: { Cookie: signUpResponseCookieHeader },
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
    headers: { Cookie: signUpResponseCookieHeader },
    redirect: "manual",
  });
  assert(responseSignUp.headers.get("set-cookie") == undefined);

  // -----------------------------------------------------------------
  // GET  /logout
  // -----------------------------------------------------------------

  let responseLogOut = await fetch(`${baseUrl}/logout`, {
    method: "GET",
    headers: { Cookie: signUpResponseCookieHeader },
    redirect: "manual",
  });
  cookieObj = cookie.parse(responseLogOut.headers.get("set-cookie"));
  assert(
    cookieObj.hasOwnProperty("_twirl"),
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
}
let port;
let server;

beforeAll(() => {
  port = freePort();
  server = launch(port);
});
afterAll(() => {
  server.close();
});

test("Basic router tests", () => basicRouteTests(port));
