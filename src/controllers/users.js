const users = {};

export function home(request, response) {
  let username = request.cookies["_twirl"];
  if (username) {
    return response.render("home.mustache", { username: username });
  }
  response.redirect("/login");
}

export function initiateSignUp(request, response) {
  if (request.cookies["_twirl"]) {
    return response.redirect("/home");
  }
  return response.render("signup.mustache", { message: "Please sign up" });
}

export function create(request, response) {
  if (request.cookies["_twirl"]) {
    return response.redirect("/home");
  }

  const username = request.body.username;
  if (users.hasOwnProperty(username)) {
    return response.send("Username already exists");
  }
  users[username] = request.body.password;
  response.cookie("_twirl", username, { maxAge: 9000000, httpOnly: true });
  return response.redirect("/home");
}

export function initiateLogIn(request, response) {
  if (request.cookies["_twirl"]) {
    return response.redirect("/home");
  }
  return response.render("login.mustache", {});
}

export function createSession(request, response) {
  if (request.cookies["_twirl"]) {
    return response.redirect("/home");
  }
  let username = request.body.username;
  if (users.hasOwnProperty(username)) {
    response.cookie("_twirl", username, { maxAge: 9000000, httpOnly: true });
    return response.redirect("/home");
  }
  return response.render("login.mustache", {
    message: "Credentials Incorrect.",
  });
}

export function endSession(request, response) {
  response.clearCookie("_twirl");
  response.redirect("/login");
}
