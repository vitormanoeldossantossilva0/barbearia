import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no ambiente.");
}

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ mensagem: "Informe e-mail e senha." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { barber: true },
    });

    if (!user?.barber) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign(
      { userId: user.id, barberId: user.barber.id },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.json({
      token,
      barber: {
        id: user.barber.id,
        name: user.barber.name,
        description: user.barber.description,
        slug: user.barber.slug,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao realizar login." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const barber = await prisma.barber.findUnique({
      where: { id: req.auth!.barberId },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        user: { select: { email: true } },
      },
    });

    if (!barber) {
      return res.status(401).json({ mensagem: "Conta não encontrada." });
    }

    return res.json({ barber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao carregar a conta." });
  }
});

export default router;
