import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Público: com barberId retorna somente os serviços daquele barbeiro.
// Sem barberId retorna os serviços disponíveis da barbearia, sem duplicar nomes.
router.get("/", async (req, res) => {
  try {
    const barberId = req.query.barberId ? Number(req.query.barberId) : undefined;

    if (barberId !== undefined && !Number.isInteger(barberId)) {
      return res.status(400).json({ mensagem: "Barbeiro inválido." });
    }

    const services = await prisma.service.findMany({
      where: barberId !== undefined ? { barberId } : { barberId: { not: null } },
      orderBy: { name: "asc" },
    });

    if (barberId !== undefined) {
      return res.json(services);
    }

    // Na Home os serviços são apenas informativos. Se mais de um barbeiro
    // possuir o mesmo serviço, mostramos o primeiro registro de cada nome.
    const unique = Array.from(
      new Map(services.map((service) => [service.name.toLowerCase(), service])).values(),
    );
    return res.json(unique);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar serviços." });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { barberId: req.auth!.barberId },
      orderBy: { name: "asc" },
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

    const service = await prisma.service.findUnique({ where: { id } });
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

    if (name.length < 2 || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ mensagem: "Informe nome e preço válidos." });
    }

    const exists = await prisma.service.findFirst({
      where: { barberId: req.auth!.barberId, name },
    });
    if (exists) return res.status(409).json({ mensagem: "Esse serviço já existe para você." });

    const service = await prisma.service.create({
      data: { name, price, barberId: req.auth!.barberId },
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
    const current = await prisma.service.findUnique({ where: { id } });

    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode alterar esse serviço." });
    }

    const name = String(req.body.name ?? "").trim();
    const price = Number(req.body.price);

    if (name.length < 2 || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ mensagem: "Informe nome e preço válidos." });
    }

    const duplicate = await prisma.service.findFirst({
      where: { barberId: req.auth!.barberId, name, NOT: { id } },
    });
    if (duplicate) return res.status(409).json({ mensagem: "Esse serviço já existe para você." });

    const service = await prisma.service.update({
      where: { id },
      data: { name, price },
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
    const current = await prisma.service.findUnique({ where: { id } });

    if (!current) return res.status(404).json({ mensagem: "Serviço não encontrado." });
    if (current.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode excluir esse serviço." });
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
