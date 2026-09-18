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

const allowedOrigins = new Set(
  String(process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/barbers", barberRoutes);
app.use("/services", serviceRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/barbershop", barbershopRoutes);
app.use("/service-topics", serviceTopicRoutes);

app.use((_req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    if (res.headersSent) return;
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  },
);

export default app;
