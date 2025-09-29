// backend/src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";

// Rutas públicas
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";

// Rutas por dominio (estas dentro llevan verifyJWT/requireRole)
import clinicRoutes from "./routes/clinic";
import foundationRoutes from "./routes/foundation";
import adminRoutes from "./routes/admin";

const app = express();

/**
 * CORS: si no pones CORS_ORIGIN, abrimos a "*"
 * (sí, ya sé, no es ideal en prod; ahora mismo estamos construyendo)
 */
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

// Healthcheck mínimo para no morir de ansiedad
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

/**
 * Rutas públicas (login, registro, perfil propio)
 * OJO: users puede tener endpoints que requieran auth,
 * pero el verifyJWT lo aplicas dentro del propio router/handler.
 */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);

/**
 * Rutas modulares protegidas por rol.
 * Dentro de cada router, usa verifyJWT + requireRole en cada endpoint.
 * /api/v1/clinic/...
 * /api/v1/foundation/...
 * /api/v1/admin/...
 */
app.use("/api/v1/clinic", clinicRoutes);
app.use("/api/v1/foundation", foundationRoutes);
app.use("/api/v1/admin", adminRoutes);

/** 404 genérico para cualquier cosa no mapeada */
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

/** Manejo básico de errores para que no explote sin decir nada */
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("API error:", err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Server error",
    });
  }
);

async function start() {
  // Validación mínima de envs que no deberían faltar
  if (!process.env.MONGODB_URI) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Falta JWT_SECRET en .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado");

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`API escuchando en :${port}`));
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});

export default app;
