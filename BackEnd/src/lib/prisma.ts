import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | undefined;

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

export function setPrismaClient(connectionString: string): void {
  if (!prisma) {
    prisma = createPrismaClient(connectionString);
  }
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Prisma ainda não foi inicializado.");
    }

    prisma = createPrismaClient(connectionString);
  }

  return prisma;
}

export default new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    return Reflect.get(client, property);
  },
});