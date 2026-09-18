import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurado no ambiente.");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  prisma = new PrismaClient({
    adapter,
  });

  return prisma;
}

export default new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    return Reflect.get(client, property);
  },
});
