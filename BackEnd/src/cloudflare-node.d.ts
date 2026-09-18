declare module "cloudflare:node" {
  import type { Server } from "node:http";

  export function httpServerHandler(options: {
    port: number;
  }): (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
}
