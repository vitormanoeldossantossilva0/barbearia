import { Router } from "express";
import prisma from "../lib/prisma";
import { adminOnly, authMiddleware } from "../middleware/auth";

const router = Router();

const clean = (value: unknown) => String(value ?? "").trim();

router.get("/public/:slug", async (req, res) => {
  try {
    const slug = clean(req.params.slug).toLowerCase();
    const shop = await prisma.barbershop.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });

    const topics = await prisma.serviceTopic.findMany({
      where: { barbershopId: shop.id },
      include: {
        services: {
          where: { barberId: { not: null } },
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            topicId: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });

    return res.json(
      topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        imageUrl: topic.imageUrl,
        services: Array.from(
          new Map(topic.services.map((service) => [service.name.trim().toLowerCase(), service])).values(),
        ),
      })),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar os tópicos de serviços." });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const barbershopId = req.auth!.barbershopId;
    if (!barbershopId || !req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Conta sem barbearia vinculada." });
    }

    const topics = await prisma.serviceTopic.findMany({
      where: { barbershopId },
      include: {
        _count: { select: { services: true } },
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });
    return res.json(topics);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus tópicos." });
  }
});

router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const barbershopId = req.auth!.barbershopId;
    if (!barbershopId || !req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Conta sem barbearia vinculada." });
    }

    const name = clean(req.body.name);
    const description = clean(req.body.description);
    const imageUrl = clean(req.body.imageUrl) || null;
    if (name.length < 2) return res.status(400).json({ mensagem: "Informe um nome válido para o tópico." });

    const exists = await prisma.serviceTopic.findUnique({
      where: { barbershopId_name: { barbershopId, name } },
    });
    if (exists) return res.status(409).json({ mensagem: "Já existe um tópico com esse nome." });

    const topic = await prisma.serviceTopic.create({
      data: { name, description, imageUrl, barbershopId },
    });
    return res.status(201).json({ ...topic, _count: { services: 0 } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao criar tópico." });
  }
});

router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const barbershopId = req.auth!.barbershopId;
    if (!Number.isInteger(id) || !barbershopId || !req.auth!.barberId) {
      return res.status(400).json({ mensagem: "Tópico inválido." });
    }

    const current = await prisma.serviceTopic.findFirst({ where: { id, barbershopId } });
    if (!current) return res.status(404).json({ mensagem: "Tópico não encontrado." });

    const name = clean(req.body.name);
    const description = clean(req.body.description);
    const imageUrl = clean(req.body.imageUrl) || null;
    if (name.length < 2) return res.status(400).json({ mensagem: "Informe um nome válido para o tópico." });

    const duplicate = await prisma.serviceTopic.findFirst({
      where: { barbershopId, name, NOT: { id } },
    });
    if (duplicate) return res.status(409).json({ mensagem: "Já existe um tópico com esse nome." });

    const topic = await prisma.serviceTopic.update({
      where: { id },
      data: { name, description, imageUrl },
      include: { _count: { select: { services: true } } },
    });
    return res.json(topic);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar tópico." });
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const barbershopId = req.auth!.barbershopId;
    if (!Number.isInteger(id) || !barbershopId || !req.auth!.barberId) {
      return res.status(400).json({ mensagem: "Tópico inválido." });
    }

    const current = await prisma.serviceTopic.findFirst({ where: { id, barbershopId } });
    if (!current) return res.status(404).json({ mensagem: "Tópico não encontrado." });

    await prisma.serviceTopic.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir tópico." });
  }
});

export default router;
