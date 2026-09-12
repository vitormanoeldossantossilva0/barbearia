import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { barberId: req.auth!.barberId },
      include: {
        barber: true,
        schedule: true,
        services: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar agendamentos." });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { barberId: req.auth!.barberId },
      include: {
        barber: true,
        schedule: true,
        services: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus agendamentos." });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: true,
        schedule: true,
        services: { include: { service: true } },
      },
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
    const services = await prisma.service.findMany({
      where: { id: { in: uniqueIds }, barberId: barberIdNumber },
    });
    if (services.length !== uniqueIds.length) {
      return res.status(400).json({ mensagem: "Um ou mais serviços não pertencem a esse barbeiro." });
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
        include: { barber: true, schedule: true, services: { include: { service: true } } },
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

router.patch("/:id/status", authMiddleware, async (req, res) => {
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
      include: {
        barber: true,
        schedule: true,
        services: { include: { service: true } },
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao atualizar status." });
  }
});

router.delete("/:id/permanent", authMiddleware, async (req, res) => {
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

router.delete("/:id", authMiddleware, async (req, res) => {
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
      include: {
        barber: true,
        schedule: true,
        services: { include: { service: true } },
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao cancelar agendamento." });
  }
});

export default router;
