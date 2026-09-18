import "dotenv/config";
import bcrypt from "bcryptjs";
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

  const shop = await prisma.barbershop.upsert({
    where: { slug: "brunao" },
    update: {},
    create: { name: "Barbearia do Brunão", slug: "brunao", description: "Seu estilo começa aqui." },
  });

  const barber = await prisma.barber.upsert({
    where: { slug: "brunao" },
    update: { barbershopId: shop.id },
    create: { name: "Brunão", description: "Barbeiro", slug: "brunao", barbershopId: shop.id },
  });

  await prisma.user.upsert({
    where: { email },
    update: { password: passwordHash, barberId: barber.id, role: "ADMIN" },
    create: { email, password: passwordHash, barberId: barber.id, role: "ADMIN" },
  });

  const topicDefaults = [
    ["Cortes", "Cabelo, degradê, social e outros estilos."],
    ["Barba", "Serviços de barba e acabamento."],
    ["Sobrancelha", "Cuidados e acabamento de sobrancelhas."],
    ["Pinturas", "Pintura, platinado, luzes e outras técnicas."],
  ] as const;
  const topics = new Map<string, number>();
  for (const [name, description] of topicDefaults) {
    const topic = await prisma.serviceTopic.upsert({
      where: { barbershopId_name: { barbershopId: shop.id, name } },
      update: { description },
      create: { name, description, barbershopId: shop.id },
    });
    topics.set(name, topic.id);
  }

  const defaults = [
    ["Cabelo", 30, "CORTE", "Cortes"],
    ["Barba", 25, "BARBA", "Barba"],
    ["Sobrancelha", 15, "SOBRANCELHA", "Sobrancelha"],
    ["Pintura", 50, "PINTURA", "Pinturas"],
  ] as const;

  for (const [name, price, category, topicName] of defaults) {
    const existing = await prisma.service.findFirst({
      where: {
        barberId: barber.id,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { price, category, barberId: barber.id, topicId: topics.get(topicName) },
      });
      continue;
    }

    // Aproveita um serviço legado sem barbeiro, quando existir, em vez de
    // criar um segundo registro invisível na área administrativa.
    const legacy = await prisma.service.findFirst({
      where: {
        barberId: null,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (legacy) {
      await prisma.service.update({
        where: { id: legacy.id },
        data: { price, category, barberId: barber.id, topicId: topics.get(topicName) },
      });
    } else {
      await prisma.service.create({
        data: { name, price, category, barberId: barber.id, topicId: topics.get(topicName) },
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

  const masterEmail = String(process.env.MASTER_EMAIL ?? "").trim().toLowerCase();
  const masterPassword = String(process.env.MASTER_PASSWORD ?? "");
  if (masterEmail && masterPassword.length >= 8) {
    await prisma.user.upsert({
      where: { email: masterEmail },
      update: { password: await bcrypt.hash(masterPassword, 12), role: "MASTER", barberId: null },
      create: { email: masterEmail, password: await bcrypt.hash(masterPassword, 12), role: "MASTER" },
    });
    console.log(`Conta master criada/atualizada: ${masterEmail}`);
  } else {
    console.log("MASTER_EMAIL/MASTER_PASSWORD não configurados; nenhuma conta master foi alterada.");
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
