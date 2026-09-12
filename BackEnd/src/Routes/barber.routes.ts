import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { adminOnly, authMiddleware } from "../middleware/auth";

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
      select: { id: true, name: true, description: true, slug: true, whatsapp: true },
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
      select: { id: true, name: true, description: true, slug: true, whatsapp: true, user: { select: { email: true, role: true } } },
    });
    if (!barber) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar sua conta." });
  }
});

router.get("/manage", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const barbers = await prisma.barber.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        whatsapp: true,
        user: { select: { email: true, role: true } },
      },
      orderBy: { name: "asc" },
    });
    return res.json(barbers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar barbeiros." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const barber = await prisma.barber.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, slug: true, whatsapp: true },
    });
    if (!barber) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar barbeiro." });
  }
});

router.post("/", authMiddleware, adminOnly, async (req, res) => {
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
        data: { name, description, slug, whatsapp: String(req.body.whatsapp ?? "").trim() || null },
      });
      const user = await tx.user.create({
        data: { email, password: hash, barberId: barber.id, role: "BARBER" },
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
    if (id !== req.auth!.barberId && req.auth!.role !== "ADMIN") {
      return res.status(403).json({ mensagem: "Você só pode editar sua própria conta." });
    }

    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const whatsapp = String(req.body.whatsapp ?? "").trim() || null;
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (name.length < 2) {
      return res.status(400).json({ mensagem: "Informe um nome válido." });
    }
    if (!email) {
      return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    }
    if (password && password.length < 8) {
      return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 8 caracteres." });
    }

    const current = await prisma.barber.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!current) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    if (!current.user) return res.status(404).json({ mensagem: "Conta de acesso do barbeiro não encontrada." });

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== current.user.id) {
      return res.status(409).json({ mensagem: "Este e-mail já está em uso." });
    }

    let slug = makeSlug(name);
    const slugOwner = await prisma.barber.findUnique({ where: { slug } });
    if (slugOwner && slugOwner.id !== id) slug = `${slug}-${id}`;

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const barber = await tx.barber.update({
        where: { id },
        data: { name, description, slug, whatsapp },
      });

      await tx.user.update({
        where: { id: current.user!.id },
        data: {
          email,
          ...(passwordHash ? { password: passwordHash } : {}),
        },
      });

      return barber;
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar barbeiro." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id !== req.auth!.barberId && req.auth!.role !== "ADMIN") {
      return res.status(403).json({ mensagem: "Você só pode excluir sua própria conta." });
    }
    if (id === req.auth!.barberId) {
      return res.status(400).json({ mensagem: "A conta administrativa principal não pode ser excluída por aqui." });
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.barber.findUnique({ where: { id }, select: { user: { select: { id: true } } } });
      await tx.barber.delete({ where: { id } });
      if (target?.user?.id) await tx.user.delete({ where: { id: target.user.id } });
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir barbeiro." });
  }
});

export default router;
