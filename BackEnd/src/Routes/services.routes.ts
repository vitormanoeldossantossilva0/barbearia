import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const categories = ["CORTE", "BARBA", "SOBRANCELHA", "PINTURA", "COMBO"] as const;
type ServiceCategory = (typeof categories)[number];

const isCategory = (value: unknown): value is ServiceCategory =>
  typeof value === "string" && categories.includes(value as ServiceCategory);

const serviceInclude = {
  comboItems: {
    include: {
      service: true,
    },
  },
} as const;

async function validateComboItems(
  barberId: number,
  serviceIds: unknown,
  currentServiceId?: number,
) {
  if (!Array.isArray(serviceIds)) {
    return { error: "Selecione pelo menos dois serviços para o combo." };
  }

  const ids = [...new Set(serviceIds.map(Number))];
  if (ids.length < 2 || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { error: "Um combo precisa ter pelo menos dois serviços válidos." };
  }
  if (currentServiceId && ids.includes(currentServiceId)) {
    return { error: "Um combo não pode incluir ele mesmo." };
  }

  const items = await prisma.service.findMany({
    where: { id: { in: ids }, barberId },
    select: { id: true, name: true, category: true },
  });

  if (items.length !== ids.length) {
    return { error: "Todos os serviços do combo precisam pertencer a você." };
  }
  if (items.some((item) => item.category === "COMBO")) {
    return { error: "Combos não podem ser usados dentro de outros combos." };
  }

  const repeatedCategory = items.find(
    (item, index) => items.findIndex((candidate) => candidate.category === item.category) !== index,
  );
  if (repeatedCategory) {
    return {
      error: `O combo não pode ter dois serviços da categoria ${repeatedCategory.category.toLowerCase()}.`,
    };
  }

  return { ids };
}

// Público: com barberId retorna os serviços daquele barbeiro, incluindo os componentes dos combos.
// Sem barberId retorna os serviços informativos da Home, sem duplicar nomes.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const barberId = req.auth!.barberId;

    // Serviços do MVP antigo podem estar órfãos (barberId = null).
    // A conta inicial do Brunão é a única autorizada a absorver esses registros.
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { slug: true },
    });

    if (barber?.slug === "brunao") {
      const orphaned = await prisma.service.findMany({
        where: { barberId: null },
        select: { id: true, name: true },
      });
      const ownedNames = await prisma.service.findMany({
        where: { barberId },
        select: { name: true },
      });
      const owned = new Set(ownedNames.map((item) => item.name.trim().toLowerCase()));
      for (const service of orphaned) {
        const normalized = service.name.trim().toLowerCase();
        if (owned.has(normalized)) continue;
        await prisma.service.update({ where: { id: service.id }, data: { barberId } });
        owned.add(normalized);
      }
    }

    const services = await prisma.service.findMany({
      where: { barberId },
      include: serviceInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return res.json(services);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus serviços." });
  }
});


router.get("/", async (req, res) => {
  try {
    const barberId = req.query.barberId ? Number(req.query.barberId) : undefined;

    if (barberId !== undefined && !Number.isInteger(barberId)) {
      return res.status(400).json({ mensagem: "Barbeiro inválido." });
    }

    const services = await prisma.service.findMany({
      where: barberId !== undefined ? { barberId } : { barberId: { not: null } },
      include: serviceInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (barberId !== undefined) return res.json(services);

    const unique = Array.from(
      new Map(services.map((service) => [service.name.toLowerCase(), service])).values(),
    );
    return res.json(unique);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar serviços." });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensagem: "Serviço inválido." });
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: serviceInclude,
    });
    if (!service) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    return res.json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar serviço." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const price = Number(req.body.price);
    const category = String(req.body.category ?? "CORTE").trim().toUpperCase();

    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !isCategory(category)) {
      return res.status(400).json({ mensagem: "Informe nome, preço e categoria válidos." });
    }

    const exists = await prisma.service.findFirst({
      where: {
        barberId: req.auth!.barberId,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (exists) {
      return res.status(409).json({
        mensagem: `Já existe um serviço chamado "${exists.name}" para este barbeiro.`,
        serviceId: exists.id,
      });
    }

    let comboIds: number[] = [];
    if (category === "COMBO") {
      const result = await validateComboItems(req.auth!.barberId, req.body.includedServiceIds);
      if ("error" in result) return res.status(400).json({ mensagem: result.error });
      comboIds = result.ids;
    }

    const service = await prisma.service.create({
      data: {
        name,
        price,
        category,
        barberId: req.auth!.barberId,
        ...(category === "COMBO"
          ? { comboItems: { create: comboIds.map((serviceId) => ({ serviceId })) } }
          : {}),
      },
      include: serviceInclude,
    });

    return res.status(201).json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao criar serviço." });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mensagem: "Serviço inválido." });

    const current = await prisma.service.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode alterar esse serviço." });
    }

    const name = String(req.body.name ?? "").trim();
    const price = Number(req.body.price);
    const category = String(req.body.category ?? current.category).trim().toUpperCase();

    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !isCategory(category)) {
      return res.status(400).json({ mensagem: "Informe nome, preço e categoria válidos." });
    }

    const duplicate = await prisma.service.findFirst({
      where: {
        barberId: req.auth!.barberId,
        name: { equals: name, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (duplicate) {
      return res.status(409).json({
        mensagem: `Já existe um serviço chamado "${duplicate.name}" para este barbeiro.`,
        serviceId: duplicate.id,
      });
    }

    if (current.category !== category) {
      const usedInCombo = await prisma.serviceComboItem.findFirst({ where: { serviceId: id } });
      if (usedInCombo) {
        return res.status(409).json({
          mensagem: "Esse serviço está em um combo. Remova-o do combo antes de mudar sua categoria.",
        });
      }
    }

    let comboIds: number[] = [];
    if (category === "COMBO") {
      const result = await validateComboItems(req.auth!.barberId, req.body.includedServiceIds, id);
      if ("error" in result) return res.status(400).json({ mensagem: result.error });
      comboIds = result.ids;
    }

    const service = await prisma.$transaction(async (tx) => {
      await tx.serviceComboItem.deleteMany({ where: { comboId: id } });

      return tx.service.update({
        where: { id },
        data: {
          name,
          price,
          category,
          ...(category === "COMBO"
            ? { comboItems: { create: comboIds.map((serviceId) => ({ serviceId })) } }
            : {}),
        },
        include: serviceInclude,
      });
    });

    return res.json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar serviço." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mensagem: "Serviço inválido." });

    const current = await prisma.service.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode excluir esse serviço." });
    }

    const usedInCombo = await prisma.serviceComboItem.findFirst({ where: { serviceId: id } });
    if (usedInCombo) {
      return res.status(409).json({ mensagem: "Remova esse serviço dos combos antes de excluí-lo." });
    }

    await prisma.service.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(409).json({
      mensagem: "Não foi possível excluir o serviço. Ele pode estar ligado a agendamentos.",
    });
  }
});

export default router;
