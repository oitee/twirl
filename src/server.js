import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import mustacheExpress from "mustache-express";
import router from "./routes.js";

export default function launch(port) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const app = express();

  app.engine("mustache", mustacheExpress());
  app.set("views", __dirname + "/../public/views");

  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(router);
  return app.listen(port, () => console.log(`Twirl listenning on ${port}...`));
}
