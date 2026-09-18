import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, barberOnly } from "../middleware/auth";

const router = Router();

const appointmentInclude = {
  barber: true,
  schedule: true,
  services: { include: { service: { include: { comboItems: { include: { service: true } } } } } },
} as const;

function parseDate(dateInput: unknown) {
  const value = String(dateInput ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

router.get("/", barberOnly, async (req, res) => {
  try {
    const date = req.query.date ? parseDate(req.query.date) : null;
    if (req.query.date && !date) {
      return res.status(400).json({ mensagem: "Data inválida." });
    }

    const where = { barberId: req.auth!.barberId, ...(date ? (() => {
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      return { schedule: { date: { gte: date, lt: end } } };
    })() : {}) };

    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ schedule: { date: "asc" } }, { schedule: { time: "asc" } }],
    });
    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar agendamentos." });
  }
});

router.get("/mine", barberOnly, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { barberId: req.auth!.barberId },
      include: appointmentInclude,
      orderBy: { createdAt: "desc" },
    });
    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus agendamentos." });
  }
});

router.get("/:id", barberOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!appointment) return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    if (appointment.barberId !== req.auth!.barberId) return res.status(403).json({ mensagem: "Você não pode acessar esse agendamento." });
    return res.json(appointment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar agendamento." });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      description,
      barberId,
      scheduleId,
      scheduleTemplateId,
      appointmentDate,
      serviceIds,
    } = req.body;

    const barberIdNumber = Number(barberId);
    const templateIdNumber = scheduleTemplateId ? Number(scheduleTemplateId) : 0;
    const scheduleIdNumber = scheduleId ? Number(scheduleId) : 0;
    const dateText = String(appointmentDate ?? "").trim();

    if (
      !customerName ||
      !customerPhone ||
      !Number.isInteger(barberIdNumber) ||
      !Array.isArray(serviceIds) ||
      serviceIds.length === 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateText)
    ) {
      return res.status(400).json({ mensagem: "Dados do agendamento inválidos." });
    }

    const [year, month, day] = dateText.split("-").map(Number);
    const appointmentDateObj = new Date(year, month - 1, day);
    if (
      appointmentDateObj.getFullYear() !== year ||
      appointmentDateObj.getMonth() !== month - 1 ||
      appointmentDateObj.getDate() !== day
    ) {
      return res.status(400).json({ mensagem: "Data do agendamento inválida." });
    }

    const start = new Date(appointmentDateObj);
    const end = new Date(appointmentDateObj);
    end.setDate(end.getDate() + 1);

    const uniqueIds = [...new Set(serviceIds.map(Number))];
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ mensagem: "Um ou mais serviços são inválidos." });
    }

    const services = await prisma.service.findMany({
      where: { id: { in: uniqueIds }, barberId: barberIdNumber },
    });
    if (services.length !== uniqueIds.length) {
      return res.status(400).json({ mensagem: "Um ou mais serviços não pertencem a esse barbeiro." });
    }

    const combos = await prisma.service.findMany({
      where: { id: { in: uniqueIds }, category: "COMBO", barberId: barberIdNumber },
      include: { comboItems: { include: { service: { select: { category: true } } } } },
    });

    if (combos.length > 1) {
      return res.status(400).json({ mensagem: "Selecione apenas um combo por agendamento." });
    }

    const selectedNonCombos = services.filter((service) => service.category !== "COMBO");
    const occupiedCategories = new Set<string>();

    for (const service of selectedNonCombos) {
      if (occupiedCategories.has(service.category)) {
        return res.status(400).json({
          mensagem: "Escolha somente uma opção por categoria para evitar serviços redundantes.",
        });
      }
      occupiedCategories.add(service.category);
    }

    if (combos[0]) {
      for (const item of combos[0].comboItems) {
        if (occupiedCategories.has(item.service.category)) {
          return res.status(400).json({
            mensagem: "Os serviços escolhidos entram em conflito com o combo selecionado.",
          });
        }
        occupiedCategories.add(item.service.category);
      }
    }

    let time = "";
    let concreteScheduleId = scheduleIdNumber || 0;

    if (templateIdNumber) {
      const template = await prisma.scheduleTemplate.findUnique({ where: { id: templateIdNumber } });
      if (!template || template.barberId !== barberIdNumber) {
        return res.status(400).json({ mensagem: "Horário não encontrado ou inválido." });
      }
      time = template.time;
    } else if (scheduleIdNumber) {
      const existing = await prisma.schedule.findUnique({ where: { id: scheduleIdNumber } });
      if (!existing || existing.barberId !== barberIdNumber) {
        return res.status(400).json({ mensagem: "Horário não encontrado ou inválido." });
      }
      if (existing.date < start || existing.date >= end) {
        return res.status(400).json({ mensagem: "O horário não pertence à data selecionada." });
      }
      time = existing.time;
    } else {
      return res.status(400).json({ mensagem: "Selecione um horário." });
    }

    const existingSchedule = await prisma.schedule.findFirst({
      where: { barberId: barberIdNumber, date: { gte: start, lt: end }, time },
      include: { appointment: true },
    });
    if (existingSchedule?.appointment) {
      return res.status(409).json({ mensagem: "Esse horário já foi reservado." });
    }
    if (existingSchedule) concreteScheduleId = existingSchedule.id;

    const appointment = await prisma.$transaction(async (tx) => {
      let finalScheduleId = concreteScheduleId;
      if (!finalScheduleId) {
        const createdSchedule = await tx.schedule.create({
          data: {
            date: start,
            time,
            barberId: barberIdNumber,
            templateId: templateIdNumber || undefined,
          },
        });
        finalScheduleId = createdSchedule.id;
      }

      const appointmentExists = await tx.appointment.findUnique({ where: { scheduleId: finalScheduleId } });
      if (appointmentExists) throw new Error("SCHEDULE_ALREADY_BOOKED");

      return tx.appointment.create({
        data: {
          customerName: String(customerName).trim(),
          customerPhone: String(customerPhone).trim(),
          description: description ? String(description).trim() : undefined,
          barberId: barberIdNumber,
          scheduleId: finalScheduleId,
          services: { create: services.map((service) => ({ serviceId: service.id, price: service.price })) },
        },
        include: appointmentInclude,
      });
    }).catch((error) => {
      if (
        error instanceof Error &&
        (error.message === "SCHEDULE_ALREADY_BOOKED" ||
          (error as { code?: string }).code === "P2002")
      ) {
        return null;
      }
      throw error;
    });

    if (!appointment) return res.status(409).json({ mensagem: "Esse horário já foi reservado." });
    return res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao criar agendamento." });
  }
});

router.patch("/:id/status", barberOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    if (appointment.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode alterar esse agendamento." });
    }

    const status = req.body.status;
    if (status !== "CONFIRMADO" && status !== "CANCELADO") {
      return res.status(400).json({ mensagem: "Status inválido." });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar status." });
  }
});

router.delete("/:id/permanent", barberOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!appointment) {
      return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    }

    if (appointment.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode excluir esse agendamento." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointmentService.deleteMany({ where: { appointmentId: id } });
      await tx.appointment.delete({ where: { id } });

      // Horários criados automaticamente a partir de um modelo são removidos junto
      // com o agendamento para que voltem a ficar disponíveis para aquela data.
      if (appointment.schedule.templateId) {
        await tx.schedule.delete({ where: { id: appointment.scheduleId } });
      }
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir agendamento." });
  }
});

router.delete("/:id", barberOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ mensagem: "Agendamento não encontrado." });
    if (appointment.barberId !== req.auth!.barberId) {
      return res.status(403).json({ mensagem: "Você não pode cancelar esse agendamento." });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELADO" },
      include: appointmentInclude,
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao cancelar agendamento." });
  }
});

export default router;
