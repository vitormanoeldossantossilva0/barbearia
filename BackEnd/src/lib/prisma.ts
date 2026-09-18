import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const GLOBAL_PRISMA_KEY = "__BARBEARIA_PRISMA_CLIENT__" as const;

type GlobalWithPrisma = typeof globalThis & {
  [GLOBAL_PRISMA_KEY]?: PrismaClient;
};

function getGlobalPrisma(): PrismaClient | undefined {
  return (globalThis as GlobalWithPrisma)[GLOBAL_PRISMA_KEY];
}

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

export function setPrismaClient(connectionString: string): void {
  const global = globalThis as GlobalWithPrisma;

  if (!global[GLOBAL_PRISMA_KEY]) {
    global[GLOBAL_PRISMA_KEY] = createPrismaClient(connectionString);
  }
}

function getPrisma(): PrismaClient {
  const client = getGlobalPrisma();

  if (client) {
    return client;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurado no ambiente.");
  }

  const localClient = createPrismaClient(connectionString);
  (globalThis as GlobalWithPrisma)[GLOBAL_PRISMA_KEY] = localClient;
  return localClient;
}

export default new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    return Reflect.get(client, property);
  },
});
