import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

function parseDate(dateInput: unknown) {
  const value = String(dateInput ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

// Público: sem date, mantém os horários concretos antigos.
// Com date, também expõe os horários-modelo cadastrados pelo barbeiro para aquele dia.
router.get("/", async (req, res) => {
  try {
    const barberId = req.query.barberId ? Number(req.query.barberId) : undefined;
    if (barberId !== undefined && !Number.isInteger(barberId)) {
      return res.status(400).json({ mensagem: "Barbeiro inválido." });
    }

    const selectedDate = req.query.date ? parseDate(req.query.date) : null;
    if (req.query.date && !selectedDate) {
      return res.status(400).json({ mensagem: "Data inválida." });
    }

    if (selectedDate && barberId !== undefined) {
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 1);

      const [templates, concrete] = await Promise.all([
        prisma.scheduleTemplate.findMany({ where: { barberId }, orderBy: { time: "asc" } }),
        prisma.schedule.findMany({
          where: { barberId, date: { gte: start, lt: end } },
          select: {
            id: true,
            date: true,
            time: true,
            barberId: true,
            templateId: true,
            appointment: { select: { id: true } },
          },
          orderBy: { time: "asc" },
        }),
      ]);

      const concreteByTime = new Map(concrete.map((s) => [s.time, s]));
      const result = templates.map((template) => {
        const existing = concreteByTime.get(template.time);
        if (existing) {
          return {
            id: existing.id,
            date: existing.date.toISOString(),
            time: existing.time,
            barberId: existing.barberId,
            templateId: existing.templateId,
            appointment: null,
            available: !existing.appointment,
          };
        }
        return {
          id: 0,
          date: start.toISOString(),
          time: template.time,
          barberId,
          templateId: template.id,
          appointment: null,
          available: true,
        };
      });

      // Inclui horários antigos/concretos que não possuem mais um modelo.
      const templateTimes = new Set(templates.map((t) => t.time));
      for (const item of concrete) {
        if (!templateTimes.has(item.time)) {
          result.push({
            id: item.id,
            date: item.date.toISOString(),
            time: item.time,
            barberId: item.barberId,
            templateId: item.templateId,
            appointment: null,
            available: !item.appointment,
          });
        }
      }

      result.sort((a, b) => a.time.localeCompare(b.time));
      return res.json(result);
    }

    const schedules = await prisma.schedule.findMany({
      where: barberId !== undefined ? { barberId } : undefined,
      select: {
        id: true,
        date: true,
        time: true,
        barberId: true,
        templateId: true,
        appointment: { select: { id: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return res.json(
      schedules.map((schedule) => ({
        id: schedule.id,
        date: schedule.date.toISOString(),
        time: schedule.time,
        barberId: schedule.barberId,
        templateId: schedule.templateId,
        appointment: null,
        available: !schedule.appointment,
      })),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar horários." });
  }
});

// Admin: mostra os horários-modelo, sem exigir dia/mês.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const templates = await prisma.scheduleTemplate.findMany({
      where: { barberId: req.auth!.barberId },
      orderBy: { time: "asc" },
    });
    return res.json(templates);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar seus horários." });
  }
});

// Cria somente o horário. A data será escolhida pelo cliente.
// O sistema trabalha somente com HH:MM (sem segundos).
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (typeof req.auth?.barberId !== "number") {
      return res.status(403).json({ mensagem: "Esta conta não possui um barbeiro vinculado." });
    }

    let time = String(req.body.time ?? "").trim();
    // Aceita HH:MM:SS somente para compatibilidade com dados/clientes antigos,
    // mas normaliza imediatamente para HH:MM antes de salvar.
    const withSeconds = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);
    if (withSeconds) time = `${withSeconds[1]}:${withSeconds[2]}`;

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ mensagem: "Informe o horário no formato HH:MM." });
    }
    const [hours, minutes] = time.split(":").map(Number);
    if (hours > 23 || minutes > 59) {
      return res.status(400).json({ mensagem: "Horário inválido." });
    }

    const exists = await prisma.scheduleTemplate.findUnique({
      where: { barberId_time: { barberId: req.auth.barberId, time } },
    });
    if (exists) return res.status(409).json({ mensagem: "Esse horário já está cadastrado." });

    const template = await prisma.scheduleTemplate.create({
      data: { time, barberId: req.auth.barberId },
    });
    return res.status(201).json(template);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao criar horário." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mensagem: "Horário inválido." });

    const template = await prisma.scheduleTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ mensagem: "Horário não encontrado." });
    if (template.barberId !== req.auth!.barberId) return res.status(403).json({ mensagem: "Você não pode excluir esse horário." });

    const used = await prisma.schedule.findFirst({ where: { templateId: id, appointment: { isNot: null } } });
    if (used) return res.status(409).json({ mensagem: "Não é possível excluir um horário que já possui agendamento." });

    await prisma.scheduleTemplate.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao excluir horário." });
  }
});

export default router;
