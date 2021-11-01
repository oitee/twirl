import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import mustacheExpress from "mustache-express";

export default function launch(port) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const app = express();

  app.engine("mustache", mustacheExpress());
  app.set("views", __dirname + "/../public/views");

  let users = {};
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/", (request, response) => {
    return response.redirect("/login");
  });

  app.get("/home", (request, response) => {
    let username = request.cookies["_twirl"];
    if (username) {
      return response.render("home.mustache", { username: username });
    }
    response.redirect("/login");
  });

  app.get("/signup", (request, response) => {
    if (request.cookies["_twirl"]) {
      return response.redirect("/home");
    }
    return response.render("signup.mustache", { message: "Please sign up" });
  });

  app.post("/signup", (request, response) => {
    const username = request.body.username;
    if (users.hasOwnProperty(username)) {
      return response.send("Username already exists");
    }
    users[username] = request.body.password;
    response.cookie("_twirl", username, { maxAge: 9000000, httpOnly: true });
    return response.redirect("/home");
  });

  app.get("/login", (request, response) => {
    if (request.cookies["_twirl"]) {
      return response.redirect("/home");
    }
    return response.render("login.mustache", {});
  });

  app.post("/login", (request, response) => {
    let username = request.body.username;
    // console.log(users);
    // console.log(username);
    if (users.hasOwnProperty(username)) {
      response.cookie("_twirl", username, { maxAge: 9000000, httpOnly: true });
      return response.redirect("/home");
    }
    return response.render("login.mustache", {
      message: "Credentials Incorrect.",
    });
  });

  app.all("/logout", (request, response) => {
    response.clearCookie("_twirl");
    console.log("Logged out");
    response.redirect("/login");
  });

  return app.listen(port, () => console.log(`Twirl listenning on ${port}...`));
}
