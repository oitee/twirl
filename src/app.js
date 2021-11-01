import express from "express";

const app = express();

app.get("/", (request, response) => {
  return response.send("hey!");
});

app.listen(4000);
