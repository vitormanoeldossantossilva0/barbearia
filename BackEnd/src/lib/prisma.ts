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

let localPrisma: PrismaClient | undefined;

function getLocalPrisma(): PrismaClient {
  if (localPrisma) {
    return localPrisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurado no ambiente.");
  }

  localPrisma = createPrismaClient(connectionString);

  return localPrisma;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getLocalPrisma();
    return Reflect.get(client, property);
  },
});

export default prisma;