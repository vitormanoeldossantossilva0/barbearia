import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./Routes/auth.routes";
import barberRoutes from "./Routes/barber.routes";
import serviceRoutes from "./Routes/services.routes";
import scheduleRoutes from "./Routes/schedules.routes";
import appointmentRoutes from "./Routes/appointments.routes";
import barbershopRoutes from "./Routes/barbershop.routes";
import serviceTopicRoutes from "./Routes/service-topics.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/barbers", barberRoutes);
app.use("/services", serviceRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/barbershop", barbershopRoutes);
app.use("/service-topics", serviceTopicRoutes);

const PORT = Number(process.env.PORT || 3333);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
