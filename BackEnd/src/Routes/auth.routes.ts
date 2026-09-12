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

router.post("/reset-password", async (req, res) => {
  try {
    const code = String(req.body.code ?? "").trim();
    const newPassword = String(req.body.newPassword ?? "");
    const resetCode = String(process.env.RESET_PASSWORD_CODE ?? "").trim();

    if (!code || !newPassword) {
      return res.status(400).json({ mensagem: "Preencha todos os campos." });
    }

    if (!resetCode || code !== resetCode) {
      return res.status(400).json({ mensagem: "Código de redefinição inválido." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const user = await prisma.user.findFirst({
      where: { barber: { isNot: null } },
      orderBy: { id: "asc" },
    });

    if (!user) {
      return res.status(404).json({ mensagem: "Nenhuma conta de barbeiro encontrada." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    return res.json({ mensagem: "Senha redefinida com sucesso." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao redefinir a senha." });
  }
});

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
        whatsapp: user.barber.whatsapp,
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
        whatsapp: true,
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
