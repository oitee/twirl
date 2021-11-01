import launch from "../../src/server.js";
import assert from "assert";
import express from "express";
import fetch from "node-fetch";

function freePort() {
  const testApp = express();
  const testServer = testApp.listen(0);
  const port = testServer.address().port;
  testServer.close();
  return port;
}

async function basicRouteTests(port) {
  let baseUrl = `http://localhost:${port}`;
  let response = await fetch(baseUrl, {
    method: "GET",
    redirect: "manual",
  });
  assert(response.status === 302, "GET / status is 302");

  let redirectResponse = await fetch(response.headers.get("location"), {
    method: "GET",
    redirect: "manual",
  });
  assert(redirectResponse.status === 200, "GET /login status is 200");
  let responseBody = await redirectResponse.text();
  assert(responseBody.startsWith(`<!DOCTYPE html>`), "GET /login returns HTML");

  let parameters = new URLSearchParams();
  parameters.append("username", "user1");
  parameters.append("password", "123");
  let loginResponse = await fetch(`${baseUrl}/login`, {
    method: "POST",
    body: parameters,
  });
  assert(
    loginResponse.status === 200,
    "POST /login with wrong credentials, returns status 200"
  );
  assert(
    (await loginResponse.text()).includes("Credentials Incorrect"),
    "POST /login body contains incorrect credentials message"
  );
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
