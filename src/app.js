import express from "express";
import path from "path";

const app = express();

app.get("/", (request, response) => {
  return response.send("hey!");
});

app.get("/home", (reques, response) => {
  return response.sendFile("home.html", { root: "public" });
});

app.get("/signup", (request, response) => {
  return response.sendFile("signup.html", { root: "public" });
});

app.get("/login", (request, response) => {
    return response.sendFile("login.html", { root: "public" });
  });

app.listen(4000);
