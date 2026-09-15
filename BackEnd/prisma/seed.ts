import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma";

async function main() {
  const email = String(process.env.BRUNAO_EMAIL ?? "").trim().toLowerCase();
  const password = String(process.env.BRUNAO_PASSWORD ?? "");

  if (!email || password.length < 6) {
    throw new Error(
      "Configure BRUNAO_EMAIL e BRUNAO_PASSWORD (mínimo 6 caracteres) no .env.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const barber = await prisma.barber.upsert({
    where: { slug: "brunao" },
    update: {},
    create: {
      name: "Brunão",
      description: "Barbeiro",
      slug: "brunao",
    },
  });

  await prisma.user.upsert({
    where: { email },
    update: { password: passwordHash, barberId: barber.id, role: "ADMIN" },
    create: { email, password: passwordHash, barberId: barber.id, role: "ADMIN" },
  });

  const defaults = [
    ["Cabelo", 30],
    ["Barba", 25],
    ["Sobrancelha", 15],
    ["Pintura", 50],
  ] as const;

  for (const [name, price] of defaults) {
    const existing = await prisma.service.findFirst({
      where: { barberId: barber.id, name },
    });

    if (!existing) {
      await prisma.service.create({
        data: { name, price, barberId: barber.id },
      });
    }
  }

  // Horários são modelos: o barbeiro cadastra somente as horas e o cliente escolhe o dia.
  for (const time of ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]) {
    await prisma.scheduleTemplate.upsert({
      where: { barberId_time: { barberId: barber.id, time } },
      update: {},
      create: { barberId: barber.id, time },
    });
  }

  console.log(`Conta inicial criada/atualizada: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
