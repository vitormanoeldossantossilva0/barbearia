import { Router } from "express";
import bcrypt from "bcryptjs";
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

const socialUrl = (value: unknown) => {
  const url = String(value ?? "").trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};



const httpUrl = (value: unknown) => {
  const url = String(value ?? "").trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};

router.get("/", async (req, res) => {
  try {
    const shopSlug = String(req.query.barbershopSlug ?? "").trim().toLowerCase();
    if (!shopSlug) {
      return res.status(400).json({
        mensagem: "Informe a barbearia.",
      });
    }

    const shop = await prisma.barbershop.findUnique({
      where: { slug: shopSlug },
    });
    if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });
    const barbers = await prisma.barber.findMany({
      where: { barbershopId: shop.id },
      select: { id: true, name: true, description: true, slug: true, whatsapp: true, imageUrl: true, instagram: true, facebook: true, tiktok: true, barbershopId: true },
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
    if (!req.auth!.barberId || !req.auth!.barbershopId) {
      return res.status(403).json({ mensagem: "Conta sem barbeiro ou barbearia vinculada." });
    }
    const barber = await prisma.barber.findFirst({
      where: { id: req.auth!.barberId, barbershopId: req.auth!.barbershopId },
      select: { id: true, name: true, description: true, slug: true, whatsapp: true, imageUrl: true, instagram: true, facebook: true, tiktok: true, barbershopId: true, user: { select: { email: true, role: true } } },
    });
    if (!barber) return res.status(404).json({ mensagem: "Barbeiro não encontrado." });
    return res.json(barber);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar sua conta." });
  }
});

router.get("/manage", authMiddleware, adminOnly, async (req, res) => {
  try {
    const barbers = await prisma.barber.findMany({
      where: { barbershopId: req.auth!.barbershopId },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        whatsapp: true,
        imageUrl: true,
        instagram: true,
        facebook: true,
        tiktok: true,
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
    const barber = await prisma.barber.findFirst({
      where: { id, ...(req.query.barbershopSlug ? { barbershop: { slug: String(req.query.barbershopSlug).trim().toLowerCase() } } : {}) },
      select: { id: true, name: true, description: true, slug: true, whatsapp: true, imageUrl: true, instagram: true, facebook: true, tiktok: true, barbershopId: true },
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
    const imageUrl = httpUrl(req.body.imageUrl);
    if (String(req.body.imageUrl ?? "").trim() && !imageUrl) {
      return res.status(400).json({ mensagem: "A imagem deve usar uma URL http:// ou https:// válida." });
    }
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const instagram = socialUrl(req.body.instagram);
    const facebook = socialUrl(req.body.facebook);
    const tiktok = socialUrl(req.body.tiktok);
    if ([req.body.instagram, req.body.facebook, req.body.tiktok].some((value) => String(value ?? "").trim() && !socialUrl(value))) {
      return res.status(400).json({ mensagem: "Os links das redes sociais devem começar com http:// ou https://." });
    }

    if (!req.auth!.barbershopId) return res.status(400).json({ mensagem: "Barbearia da conta não encontrada." });

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
        data: {
          name,
          description,
          slug,
          whatsapp: String(req.body.whatsapp ?? "").trim() || null,
          imageUrl,
          instagram,
          facebook,
          tiktok,
          barbershopId: req.auth!.barbershopId,
        },
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
    const imageUrl = httpUrl(req.body.imageUrl);
    if (String(req.body.imageUrl ?? "").trim() && !imageUrl) {
      return res.status(400).json({ mensagem: "A imagem deve usar uma URL http:// ou https:// válida." });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: "Barbeiro inválido." });
    if (!req.auth!.barbershopId || !req.auth!.barberId) return res.status(403).json({ mensagem: "Conta sem barbearia vinculada." });
    if (req.auth!.role !== "ADMIN" && id !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você só pode editar sua própria conta." });
    }

    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const whatsapp = String(req.body.whatsapp ?? "").trim() || null;
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const instagram = socialUrl(req.body.instagram);
    const facebook = socialUrl(req.body.facebook);
    const tiktok = socialUrl(req.body.tiktok);
    if ([req.body.instagram, req.body.facebook, req.body.tiktok].some((value) => String(value ?? "").trim() && !socialUrl(value))) {
      return res.status(400).json({ mensagem: "Os links das redes sociais devem começar com http:// ou https://." });
    }

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
    if (current.barbershopId !== req.auth!.barbershopId) return res.status(403).json({ mensagem: "Você não pode acessar esse barbeiro." });
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
        data: {
          name,
          description,
          slug,
          whatsapp,
          imageUrl: req.body.imageUrl === undefined ? current.imageUrl : imageUrl,
          instagram,
          facebook,
          tiktok,
        },
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
    if (!Number.isInteger(id) || id <= 0 || !req.auth!.barbershopId || !req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Conta sem barbearia vinculada." });
    }
    if (id !== req.auth!.barberId && req.auth!.role !== "ADMIN") {
      return res.status(403).json({ mensagem: "Você só pode excluir sua própria conta." });
    }
    if (id === req.auth!.barberId) {
      return res.status(400).json({ mensagem: "A conta administrativa principal não pode ser excluída por aqui." });
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.barber.findUnique({
        where: { id },
        select: { barbershopId: true, user: { select: { id: true, role: true } } },
      });
      if (!target) throw new Error("Barbeiro não encontrado.");
      if (target.barbershopId !== req.auth!.barbershopId) {
        const error = new Error("FORBIDDEN_BARBERSHOP");
        (error as Error & { status?: number }).status = 403;
        throw error;
      }
      if (target.user?.role !== "BARBER") {
        const error = new Error("PROTECTED_ACCOUNT");
        (error as Error & { status?: number }).status = 400;
        throw error;
      }

      // Remove primeiro os vínculos dependentes para que a exclusão do barbeiro
      // também funcione quando ele possui serviços, horários e agendamentos.
      const appointments = await tx.appointment.findMany({
        where: { barberId: id },
        select: { id: true },
      });
      const appointmentIds = appointments.map((appointment) => appointment.id);

      if (appointmentIds.length) {
        await tx.appointmentService.deleteMany({
          where: { appointmentId: { in: appointmentIds } },
        });
        await tx.appointment.deleteMany({
          where: { id: { in: appointmentIds } },
        });
      }

      await tx.schedule.deleteMany({ where: { barberId: id } });
      await tx.scheduleTemplate.deleteMany({ where: { barberId: id } });

      const services = await tx.service.findMany({
        where: { barberId: id },
        select: { id: true },
      });
      const serviceIds = services.map((service) => service.id);

      if (serviceIds.length) {
        await tx.serviceComboItem.deleteMany({
          where: {
            OR: [
              { comboId: { in: serviceIds } },
              { serviceId: { in: serviceIds } },
            ],
          },
        });
        await tx.service.deleteMany({ where: { id: { in: serviceIds } } });
      }

      if (target.user?.id) {
        await tx.user.delete({ where: { id: target.user.id } });
      }

      await tx.barber.delete({ where: { id } });
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error instanceof Error && (error as Error & { status?: number }).status === 403) return res.status(403).json({ mensagem: "Você não pode excluir esse barbeiro." });
    if (error instanceof Error && (error as Error & { status?: number }).status === 400 && error.message === "PROTECTED_ACCOUNT") {
      return res.status(400).json({ mensagem: "A conta administrativa principal da barbearia não pode ser excluída por aqui." });
    }
    return res.status(500).json({ mensagem: "Erro ao excluir barbeiro." });
  }
});

export default router;
