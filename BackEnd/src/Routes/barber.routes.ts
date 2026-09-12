import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const makeSlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

router.get("/", async (_req, res) => {
  try {
    const barbers = await prisma.barber.findMany({
      select: { id: true, name: true, description: true, slug: true },
      orderBy: { name: "asc" },
    });
    return res.json(barbers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar barbeiros." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const barber = await prisma.barber.findUnique({
      where: { id: req.auth!.barberId },
      select: { id: true, name: true, description: true, slug: true, user: { select: { email: true } } },
    });
    if (!barber) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar sua conta." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { schedules: true },
    });
    if (!barber) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar barbeiro." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (name.length < 2 || !email || password.length < 8) {
      return res.status(400).json({
        mensagem: "Informe nome, e-mail e uma senha de pelo menos 8 caracteres.",
      });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ mensagem: "Este e-mail já está em uso." });

    let slug = makeSlug(name);
    const slugExists = await prisma.barber.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    const hash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const barber = await tx.barber.create({
        data: { name, description, slug },
      });
      const user = await tx.user.create({
        data: { email, password: hash, barberId: barber.id },
      });
      return { barber, user };
    });

    return res.status(201).json({
      barber: result.barber,
      email: result.user.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao criar barbeiro." });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você só pode editar sua própria conta." });
    }

    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();

    if (name.length < 2) return res.status(400).json({ mensagem: "Informe um nome válido." });

    const current = await prisma.barber.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });

    let slug = makeSlug(name);
    const slugOwner = await prisma.barber.findUnique({ where: { slug } });
    if (slugOwner && slugOwner.id !== id) slug = `${slug}-${id}`;

    const barber = await prisma.barber.update({
      where: { id },
      data: { name, description, slug },
    });

    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar barbeiro." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você só pode excluir sua própria conta." });
    }

    await prisma.barber.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir barbeiro." });
  }
});

export default router;
