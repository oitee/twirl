import express, { urlencoded, json } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import mustacheExpress from "mustache-express";
import router from "./routes.js";
import { COOKIE_SECRET } from "./constants.js";
import cookieEncrypter from "cookie-encrypter";
import { poolStart } from "./db/connection.js";

export default function launch(port) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const app = express();

  app.engine("mustache", mustacheExpress());
  app.set("views", __dirname + "/../public/views");

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(cookieParser(COOKIE_SECRET));
  app.use(cookieEncrypter(COOKIE_SECRET));

  app.use(router);
  poolStart();
  return app.listen(port, () => console.log(`Twirl listenning on ${port}...`));
}
