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

  try {
    const payload = jwt.verify(
      header.slice(7),
      JWT_SECRET,
    ) as Partial<AuthPayload>;

    if (
      typeof payload.userId !== "number" ||
      !["MASTER", "ADMIN", "BARBER"].includes(String(payload.role))
    ) {
      return res.status(401).json({ mensagem: "Token inválido." });
    }

    if (payload.role !== "MASTER" && typeof payload.barberId !== "number") {
      return res.status(401).json({ mensagem: "Token inválido." });
    }

    req.auth = {
      userId: payload.userId,
      barberId: payload.barberId,
      role: payload.role as UserRole,
      barbershopId: payload.barbershopId,
    };

    next();
  } catch {
    return res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }
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
