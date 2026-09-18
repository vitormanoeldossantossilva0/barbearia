import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import app from "./app";

app.use((req, _res, next) => {
  process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;
  next();
});

app.listen(3000);

export default httpServerHandler({ port: 3000 });