import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const isValidEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post("/reset-password", async (req, res) => {
  try {
    const code = String(req.body.code ?? "").trim();
    const newPassword = String(req.body.newPassword ?? "");
    const resetCode = String(process.env.RESET_PASSWORD_CODE ?? "").trim();

    if (!code || !newPassword) {
      return res.status(400).json({ mensagem: "Preencha todos os campos." });
    }

    if (code.length > 256 || !resetCode || code !== resetCode) {
      return res.status(400).json({ mensagem: "Código de redefinição inválido." });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({
        mensagem: "A nova senha deve ter entre 8 e 128 caracteres.",
      });
    }

    const user = await prisma.user.findFirst({
      where: { role: "ADMIN", barber: { isNot: null } },
      orderBy: { id: "asc" },
    });

    if (!user) {
      return res.status(404).json({
        mensagem: "Nenhuma conta de barbeiro encontrada.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 12) },
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

    if (!isValidEmail(email) || password.length < 1 || password.length > 128) {
      return res.status(400).json({ mensagem: "E-mail ou senha inválidos." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { barber: { include: { barbershop: true } } },
    });

    if (!user) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return res.status(500).json({
        mensagem: "Configuração de autenticação não encontrada.",
      });
    }

    if (
      user.role !== "MASTER" &&
      (!user.barber || !user.barber.barbershopId)
    ) {
      return res.status(403).json({
        mensagem: "Conta sem vínculo válido com uma barbearia.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        ...(user.role === "MASTER"
          ? {}
          : {
              barberId: user.barber!.id,
              barbershopId: user.barber!.barbershopId,
            }),
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
        algorithm: "HS256",
      },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        barbershopId: user.barber?.barbershopId ?? null,
      },
      barber: user.barber
        ? { ...user.barber, barbershop: undefined, user: undefined }
        : null,
      barbershop: user.barber?.barbershop ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao realizar login." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { barber: { include: { barbershop: true } } },
    });

    if (!user) {
      return res.status(401).json({ mensagem: "Conta não encontrada." });
    }

    if (
      user.role !== req.auth!.role ||
      (user.role !== "MASTER" &&
        (!user.barber ||
          user.barber.id !== req.auth!.barberId ||
          user.barber.barbershopId !== req.auth!.barbershopId))
    ) {
      return res.status(401).json({ mensagem: "Sessão inválida." });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        barbershopId: user.barber?.barbershopId ?? null,
      },
      barber: user.barber
        ? { ...user.barber, barbershop: undefined, user: undefined }
        : null,
      barbershop: user.barber?.barbershop ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao carregar a conta." });
  }
});

export default router;
