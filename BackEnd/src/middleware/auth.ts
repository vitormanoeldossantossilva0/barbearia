import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "MASTER" | "ADMIN" | "BARBER";

export interface AuthPayload {
  userId: number;
  barberId?: number;
  role: UserRole;
  barbershopId?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const JWT_ALGORITHM = "HS256" as const;

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return res.status(500).json({
      mensagem: "Configuração de autenticação não encontrada.",
    });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Não autenticado." });
  }

  const token = header.slice(7).trim();
  if (!token || token.length > 4096) {
    return res.status(401).json({ mensagem: "Token inválido." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as Partial<AuthPayload>;

    const userId = payload.userId;
    const role = payload.role;
    const barberId = payload.barberId;
    const barbershopId = payload.barbershopId;

    if (
      typeof userId !== "number" ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !["MASTER", "ADMIN", "BARBER"].includes(String(role))
    ) {
      return res.status(401).json({ mensagem: "Token inválido." });
    }

    if (role === "MASTER") {
      if (barberId !== undefined || barbershopId !== undefined) {
        return res.status(401).json({ mensagem: "Token inválido." });
      }
    } else {
      if (
        typeof barberId !== "number" ||
        !Number.isInteger(barberId) ||
        barberId <= 0 ||
        typeof barbershopId !== "number" ||
        !Number.isInteger(barbershopId) ||
        barbershopId <= 0
      ) {
        return res.status(401).json({ mensagem: "Token inválido." });
      }
    }

    req.auth = {
      userId,
      barberId,
      role: role as UserRole,
      barbershopId,
    };

    next();
  } catch {
    return res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }
}

export function barberOnly(req: Request, res: Response, next: NextFunction) {
  if (
    (req.auth?.role !== "ADMIN" && req.auth?.role !== "BARBER") ||
    typeof req.auth.barberId !== "number" ||
    typeof req.auth.barbershopId !== "number"
  ) {
    return res.status(403).json({
      mensagem: "Acesso permitido somente a contas de barbearia.",
    });
  }
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "ADMIN") {
    return res.status(403).json({
      mensagem: "Acesso permitido somente para administradores.",
    });
  }
  next();
}

export function masterOnly(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "MASTER") {
    return res.status(403).json({
      mensagem: "Acesso permitido somente ao administrador da plataforma.",
    });
  }
  next();
}
