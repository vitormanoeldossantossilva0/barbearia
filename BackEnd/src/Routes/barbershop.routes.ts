import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { authMiddleware, masterOnly } from "../middleware/auth";

const router = Router();
const makeSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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

router.get("/public-default", async (_req, res) => {
  try {
    const shop = await prisma.barbershop.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        barbers: {
          select: { id: true, name: true, description: true, slug: true, whatsapp: true, imageUrl: true, instagram: true, facebook: true, tiktok: true },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!shop) return res.status(404).json({ mensagem: "Nenhuma barbearia cadastrada." });
    return res.json(shop);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar a barbearia principal." });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug).trim().toLowerCase();
    const shop = await prisma.barbershop.findUnique({
      where: { slug },
      include: { barbers: { select: { id: true, name: true, description: true, slug: true, whatsapp: true, imageUrl: true, instagram: true, facebook: true, tiktok: true }, orderBy: { name: "asc" } } },
    });
    if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });
    return res.json(shop);
  } catch (error) { console.error(error); return res.status(500).json({ mensagem: "Erro ao buscar barbearia." }); }
});


router.get("/mine", authMiddleware, async (req, res) => {
  try {
    if (!req.auth!.barbershopId) return res.status(400).json({ mensagem: "Barbearia da conta não encontrada." });
    const shop = await prisma.barbershop.findUnique({ where: { id: req.auth!.barbershopId } });
    if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });
    return res.json(shop);
  } catch (error) { console.error(error); return res.status(500).json({ mensagem: "Erro ao buscar sua barbearia." }); }
});

router.put("/mine", authMiddleware, async (req, res) => {
  try {
    if (req.auth!.role !== "ADMIN" || !req.auth!.barbershopId) return res.status(403).json({ mensagem: "Somente o administrador da barbearia pode alterar essas informações." });
    const current = await prisma.barbershop.findUnique({ where: { id: req.auth!.barbershopId } });
    if (!current) return res.status(404).json({ mensagem: "Barbearia não encontrada." });
    const name = String(req.body.name ?? current.name).trim();
    const description = String(req.body.description ?? current.description).trim();
    const whatsapp = String(req.body.whatsapp ?? current.whatsapp ?? "").trim() || null;
    const imageUrl = String(req.body.imageUrl ?? current.imageUrl ?? "").trim() || null;
    const instagram = socialUrl(req.body.instagram ?? current.instagram);
    const facebook = socialUrl(req.body.facebook ?? current.facebook);
    const tiktok = socialUrl(req.body.tiktok ?? current.tiktok);
    if ([req.body.instagram, req.body.facebook, req.body.tiktok].some((value) => String(value ?? "").trim() && !socialUrl(value))) {
      return res.status(400).json({ mensagem: "Os links das redes sociais devem começar com http:// ou https://." });
    }
    if (name.length < 2) return res.status(400).json({ mensagem: "Informe um nome válido." });
    const shop = await prisma.barbershop.update({ where: { id: current.id }, data: { name, description, whatsapp, imageUrl, instagram, facebook, tiktok } });
    return res.json(shop);
  } catch (error) { console.error(error); return res.status(500).json({ mensagem: "Erro ao atualizar sua barbearia." }); }
});

router.get("/master", authMiddleware, masterOnly, async (_req, res) => {
  const shops = await prisma.barbershop.findMany({ include: { _count: { select: { barbers: true } } }, orderBy: { createdAt: "desc" } });
  return res.json(shops);
});

router.post("/master", authMiddleware, masterOnly, async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const ownerName = String(req.body.ownerName ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const description = String(req.body.description ?? "").trim();
    const whatsapp = String(req.body.whatsapp ?? "").trim() || null;
    const instagram = socialUrl(req.body.instagram);
    const facebook = socialUrl(req.body.facebook);
    const tiktok = socialUrl(req.body.tiktok);
    if ([req.body.instagram, req.body.facebook, req.body.tiktok].some((value) => String(value ?? "").trim() && !socialUrl(value))) {
      return res.status(400).json({ mensagem: "Os links das redes sociais devem começar com http:// ou https://." });
    }
    const requestedSlug = String(req.body.slug ?? "").trim();
    if (name.length < 2 || ownerName.length < 2 || !email || password.length < 8) return res.status(400).json({ mensagem: "Informe barbearia, responsável, e-mail e senha de pelo menos 8 caracteres." });
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ mensagem: "Este e-mail já está em uso." });
    let slug = makeSlug(requestedSlug || name);
    if (!slug) return res.status(400).json({ mensagem: "Informe um slug válido." });
    if (await prisma.barbershop.findUnique({ where: { slug } })) return res.status(409).json({ mensagem: "Este slug já está em uso." });
    let barberSlug = makeSlug(ownerName);
    if (await prisma.barber.findUnique({ where: { slug: barberSlug } })) barberSlug = `${barberSlug}-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async tx => {
      const shop = await tx.barbershop.create({ data: { name, slug, description, whatsapp, imageUrl: String(req.body.imageUrl ?? "").trim() || null, instagram, facebook, tiktok } });
      const barber = await tx.barber.create({ data: { name: ownerName, description: "Administrador da barbearia", slug: barberSlug, whatsapp, barbershopId: shop.id } });
      const user = await tx.user.create({ data: { email, password: passwordHash, role: "ADMIN", barberId: barber.id } });
      const topics = await Promise.all([
        ["Cortes", "Cabelo, degradê, social e outros estilos."],
        ["Barba", "Serviços de barba e acabamento."],
        ["Sobrancelha", "Cuidados e acabamento de sobrancelhas."],
        ["Pinturas", "Pintura, platinado, luzes e outras técnicas."],
      ].map(([topicName, topicDescription]) =>
        tx.serviceTopic.create({ data: { name: topicName, description: topicDescription, barbershopId: shop.id } }),
      ));
      const topicByName = new Map(topics.map((topic) => [topic.name, topic.id]));
      for (const [serviceName, category, topicName] of [["Cabelo","CORTE","Cortes"],["Barba","BARBA","Barba"],["Sobrancelha","SOBRANCELHA","Sobrancelha"],["Pintura","PINTURA","Pinturas"]] as const) {
        await tx.service.create({ data: { name: serviceName, category, price: 0, barberId: barber.id, topicId: topicByName.get(topicName) } });
      }
      return { shop, barber, user };
    });
    return res.status(201).json({ barbershop: result.shop, barber: result.barber, email: result.user.email });
  } catch (error) { console.error(error); return res.status(500).json({ mensagem: "Erro ao criar barbearia." }); }
});

router.delete("/master/:id", authMiddleware, masterOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: "Barbearia inválida." });

    const shop = await prisma.barbershop.findUnique({
      where: { id },
      include: { barbers: { select: { id: true } } },
    });
    if (!shop) return res.status(404).json({ mensagem: "Barbearia não encontrada." });

    await prisma.$transaction(async (tx) => {
      const barberIds = shop.barbers.map((barber) => barber.id);

      if (barberIds.length > 0) {
        const appointments = await tx.appointment.findMany({
          where: { barberId: { in: barberIds } },
          select: { id: true },
        });
        const appointmentIds = appointments.map((appointment) => appointment.id);

        if (appointmentIds.length > 0) {
          await tx.appointmentService.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
          await tx.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
        }

        await tx.schedule.deleteMany({ where: { barberId: { in: barberIds } } });
        await tx.scheduleTemplate.deleteMany({ where: { barberId: { in: barberIds } } });

        const services = await tx.service.findMany({
          where: { barberId: { in: barberIds } },
          select: { id: true },
        });
        const serviceIds = services.map((service) => service.id);

        if (serviceIds.length > 0) {
          await tx.serviceComboItem.deleteMany({
            where: { OR: [{ comboId: { in: serviceIds } }, { serviceId: { in: serviceIds } }] },
          });
          await tx.service.deleteMany({ where: { id: { in: serviceIds } } });
        }

        await tx.user.deleteMany({ where: { barberId: { in: barberIds } } });
        await tx.barber.deleteMany({ where: { id: { in: barberIds } } });
      }

      await tx.barbershop.delete({ where: { id } });
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir barbearia." });
  }
});

router.put("/master/:id", authMiddleware, masterOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const current = await prisma.barbershop.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ mensagem: "Barbearia não encontrada." });
    const name = String(req.body.name ?? current.name).trim();
    const description = String(req.body.description ?? current.description).trim();
    const whatsapp = String(req.body.whatsapp ?? current.whatsapp ?? "").trim() || null;
    const imageUrl = String(req.body.imageUrl ?? current.imageUrl ?? "").trim() || null;
    const instagram = socialUrl(req.body.instagram ?? current.instagram);
    const facebook = socialUrl(req.body.facebook ?? current.facebook);
    const tiktok = socialUrl(req.body.tiktok ?? current.tiktok);
    if ([req.body.instagram, req.body.facebook, req.body.tiktok].some((value) => String(value ?? "").trim() && !socialUrl(value))) {
      return res.status(400).json({ mensagem: "Os links das redes sociais devem começar com http:// ou https://." });
    }
    const slug = makeSlug(String(req.body.slug ?? current.slug));
    const slugOwner = await prisma.barbershop.findUnique({ where: { slug } });
    if (slugOwner && slugOwner.id !== id) return res.status(409).json({ mensagem: "Este slug já está em uso." });
    const shop = await prisma.barbershop.update({ where: { id }, data: { name, description, whatsapp, imageUrl, instagram, facebook, tiktok, slug } });
    return res.json(shop);
  } catch (error) { console.error(error); return res.status(500).json({ mensagem: "Erro ao atualizar barbearia." }); }
});

export default router;
