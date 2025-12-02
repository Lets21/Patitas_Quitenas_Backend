// backend/src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import type { CorsOptions, CorsOptionsDelegate } from "cors";
import mongoose from "mongoose";
import path from "path";
import cookieParser from "cookie-parser";

// Middlewares
import { requireAuth, requireRole } from "./middleware/auth";

// Rutas
import animalsRoutes from "./routes/animals";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import clinicRoutes from "./routes/clinic";
import foundationRoutes from "./routes/foundation";
import adminRoutes from "./routes/admin";
import foundationAnimalsRoutes from "./routes/foundation.animals";
import applicationsRouter from "./routes/applications";
import contactRouter from "./routes/contact";
import notificationsRouter from "./routes/notifications";
import matchingRouter from "./routes/matching";

const app = express();

/* ------------------------------- CORS ------------------------------- */
const allowedFromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Permite previews de Vercel: https://patitas-quitenas-<hash>.vercel.app
const vercelPreview = /^https:\/\/patitas-quitenas-[a-z0-9-]+\.vercel\.app$/i;

// En dev, asegura front local
if (!allowedFromEnv.includes("http://localhost:5173")) {
  allowedFromEnv.push("http://localhost:5173");
}

const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  const origin = (req.headers.origin as string) || "";
  const allow = !origin || allowedFromEnv.includes(origin) || vercelPreview.test(origin);

  const opts: CorsOptions = {
    origin: allow,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  cb(null, opts);
};

app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate));
app.use((_req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

/* --------------------------- Parsers & static --------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// __dirname en runtime ≈ dist/src ⇒ subo 1 nivel a dist/
const uploadsDir = path.resolve(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

/* -------------------------------- Health -------------------------------- */
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

/* --------------------------------- Rutas --------------------------------- */
// Público
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/animals", animalsRoutes); // catálogo público

// Contacto (POST público, GET/PATCH/DELETE requieren auth)
app.use("/api/v1/contact", (req, res, next) => {
  // POST es público, los demás métodos requieren autenticación de admin
  if (req.method === "POST") {
    return next();
  }
  return requireAuth(req, res, () => requireRole("ADMIN")(req, res, next));
}, contactRouter);

// Protegidas por rol
app.use("/api/v1/users", requireAuth, usersRouter);
app.use("/api/v1/clinic", requireAuth, clinicRoutes);
app.use("/api/v1/admin", requireAuth, requireRole("ADMIN"), adminRoutes);
// Solicitudes de adopción
app.use("/api/v1/applications", applicationsRouter); // el router decide auth/roles

// Notificaciones de la fundación
app.use("/api/v1/notifications", notificationsRouter);

// Matching con KNN (requiere autenticación)
app.use("/api/v1/matching", requireAuth, matchingRouter);

/**
 * ⚠️ IMPORTANTE: Montar PRIMERO la subruta específica de animales de fundación
 * para evitar colisiones con el router base de fundación.
 */
app.use(
  "/api/v1/foundation/animals",
  requireAuth,
  requireRole("FUNDACION"),
  foundationAnimalsRoutes
);

/** Luego el router base de fundación (NO debe volver a definir '/animals') */
app.use(
  "/api/v1/foundation",
  requireAuth,
  requireRole("FUNDACION"),
  foundationRoutes
);

/* ---------------------------------- 404 ---------------------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/* ------------------------------ Error handler ---------------------------- */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

/* --------------------------------- Start -------------------------------- */

// Exporta solo la instancia de app para los tests y para el arranque en index.ts
export default app;
