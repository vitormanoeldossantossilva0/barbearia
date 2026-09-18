import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

let prisma: PrismaClient | undefined;

export function setPrismaClient(connectionString: string): void {
  if (!prisma) {
    prisma = createPrismaClient(connectionString);
  }
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error("Prisma ainda não foi inicializado.");
  }

  return prisma;
}

export default new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    return Reflect.get(client, property);
  },
});