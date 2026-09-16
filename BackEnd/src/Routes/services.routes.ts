import { Router, type Request } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const categories = ["CORTE", "BARBA", "SOBRANCELHA", "PINTURA", "COMBO"] as const;
type ServiceCategory = (typeof categories)[number];

const isCategory = (value: unknown): value is ServiceCategory =>
  typeof value === "string" && categories.includes(value as ServiceCategory);

const serviceInclude = {
  topic: true,
  comboItems: {
    include: {
      service: {
        include: { topic: true },
      },
    },
  },
} as const;

function getAuthScope(req: Request) {
  const barberId = req.auth?.barberId;
  const barbershopId = req.auth?.barbershopId;
  if (!barberId || !barbershopId) return null;
  return { barberId, barbershopId };
}

async function validateTopic(topicId: unknown, barbershopId: number) {
  const parsed = Number(topicId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: "Selecione um tópico válido." };
  }

  const topic = await prisma.serviceTopic.findFirst({
    where: { id: parsed, barbershopId },
    select: { id: true },
  });
  if (!topic) return { error: "O tópico selecionado não pertence a esta barbearia." };
  return { topicId: parsed };
}

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

// Público: com barberId retorna os serviços daquele barbeiro.
// Com barbershopSlug, limita a consulta àquela barbearia.
router.get("/", async (req, res) => {
  try {
    const barberId = req.query.barberId ? Number(req.query.barberId) : undefined;
    const barbershopSlug = String(req.query.barbershopSlug ?? "").trim().toLowerCase();

    if (barberId !== undefined && (!Number.isInteger(barberId) || barberId <= 0)) {
      return res.status(400).json({ mensagem: "Barbeiro inválido." });
    }

    let shopBarberIds: number[] | undefined;
    if (barbershopSlug) {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: barbershopSlug },
        select: { id: true },
      });
      if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });

      const shopBarbers = await prisma.barber.findMany({
        where: { barbershopId: shop.id },
        select: { id: true },
      });
      shopBarberIds = shopBarbers.map((barber) => barber.id);

      if (barberId !== undefined && !shopBarberIds.includes(barberId)) {
        return res.status(404).json({ mensagem: "Barbeiro não pertence a esta barbearia." });
      }
    }

    const where = barberId !== undefined
      ? { barberId }
      : shopBarberIds
        ? { barberId: { in: shopBarberIds } }
        : { barberId: { not: null } };

    const services = await prisma.service.findMany({
      where,
      include: serviceInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (barberId !== undefined) return res.json(services);

    const unique = Array.from(
      new Map(
        services.map((service) => [
          `${service.topicId ?? "sem-topico"}:${service.name.trim().toLowerCase()}`,
          service,
        ]),
      ).values(),
    );
    return res.json(unique);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar serviços." });
  }
});

// Área autenticada do barbeiro/admin da barbearia.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const scope = getAuthScope(req);
    if (!scope) return res.status(403).json({ mensagem: "Conta sem barbeiro ou barbearia vinculada." });

    const services = await prisma.service.findMany({
      where: { barberId: scope.barberId },
      include: serviceInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return res.json(services);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus serviços." });
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
    const scope = getAuthScope(req);
    if (!scope) return res.status(403).json({ mensagem: "Conta sem barbeiro ou barbearia vinculada." });

    const name = String(req.body.name ?? "").trim();
    const price = Number(req.body.price);
    const category = String(req.body.category ?? "CORTE").trim().toUpperCase();

    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !isCategory(category)) {
      return res.status(400).json({ mensagem: "Informe nome, preço e categoria válidos." });
    }

    const topicResult = await validateTopic(req.body.topicId, scope.barbershopId);
    if ("error" in topicResult) return res.status(400).json({ mensagem: topicResult.error });

    const exists = await prisma.service.findFirst({
      where: {
        barberId: scope.barberId,
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
      const result = await validateComboItems(scope.barberId, req.body.includedServiceIds);
      if ("error" in result) return res.status(400).json({ mensagem: result.error });
      comboIds = result.ids;
    }

    const service = await prisma.service.create({
      data: {
        name,
        price,
        category,
        barberId: scope.barberId,
        topicId: topicResult.topicId,
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
    const scope = getAuthScope(req);
    if (!scope) return res.status(403).json({ mensagem: "Conta sem barbeiro ou barbearia vinculada." });

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mensagem: "Serviço inválido." });

    const current = await prisma.service.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== scope.barberId) {
      return res.status(403).json({ mensagem: "Você não pode alterar esse serviço." });
    }

    const name = String(req.body.name ?? "").trim();
    const price = Number(req.body.price);
    const category = String(req.body.category ?? current.category).trim().toUpperCase();

    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !isCategory(category)) {
      return res.status(400).json({ mensagem: "Informe nome, preço e categoria válidos." });
    }

    const topicResult = await validateTopic(req.body.topicId ?? current.topicId, scope.barbershopId);
    if ("error" in topicResult) return res.status(400).json({ mensagem: topicResult.error });

    const duplicate = await prisma.service.findFirst({
      where: {
        barberId: scope.barberId,
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
      const result = await validateComboItems(scope.barberId, req.body.includedServiceIds, id);
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
          topicId: topicResult.topicId,
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
    const scope = getAuthScope(req);
    if (!scope) return res.status(403).json({ mensagem: "Conta sem barbeiro ou barbearia vinculada." });

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mensagem: "Serviço inválido." });

    const current = await prisma.service.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== scope.barberId) {
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
