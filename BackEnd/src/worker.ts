import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import app from "./app";
import { setPrismaClient } from "./lib/prisma";

app.use((_req, _res, next) => {
  setPrismaClient(env.HYPERDRIVE.connectionString);
  next();
});

app.listen(3000);

export default httpServerHandler({ port: 3000 });
