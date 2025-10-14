// backend/src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import type { CorsOptions, CorsOptionsDelegate } from "cors";
import mongoose from "mongoose";
import path from "path";

// Rutas (sin .js, esto es TS)
import animalsRoutes from "./routes/animals";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import clinicRoutes from "./routes/clinic";
import foundationRoutes from "./routes/foundation";
import adminRoutes from "./routes/admin";
import foundationAnimalsRoutes from "./routes/foundation.animals";

const app = express();

/* ------------------------------- CORS robusto ------------------------------ */
/* Lee una lista separada por coma en CORS_ORIGIN y permite previews de Vercel.
   Ej: CORS_ORIGIN="http://localhost:5173,https://patitas-quitenas.vercel.app" */
const staticAllowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Acepta cualquier preview: https://patitas-quitenas-<hash>.vercel.app
const vercelPreview = /^https:\/\/patitas-quitenas-[a-z0-9-]+\.vercel\.app$/i;

const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  // FIX: CorsRequest no tiene req.header(); tomamos de headers
  const reqOrigin = (req.headers?.origin as string) || "";

  const allowed =
    !reqOrigin || staticAllowed.includes(reqOrigin) || vercelPreview.test(reqOrigin);

  const options: CorsOptions = {
    origin: allowed, // true o false
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  cb(null, options);
};

// Debe ir antes de las rutas
app.use(cors(corsDelegate));
// Preflight para todo
app.options("*", cors(corsDelegate));
// Ayuda a caches/proxies a variar por Origin
app.use((_req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

/* ----------------------------- Parsers & static ---------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// En runtime, __dirname apunta a /dist/src. Subimos 1 nivel para llegar a /dist.
const uploadsDir = path.resolve(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

/* --------------------------------- Health --------------------------------- */
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

/* ---------------------------------- Rutas --------------------------------- */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);

app.use("/api/v1/clinic", clinicRoutes);
app.use("/api/v1/foundation", foundationRoutes);
app.use("/api/v1/admin", adminRoutes);

// Animales generales
app.use("/api/v1/animals", animalsRoutes);

// Animales de fundación
app.use("/api/v1/foundation/animals", foundationAnimalsRoutes);

/* --------------------------------- 404 ------------------------------------ */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/* ------------------------------- Error handler ---------------------------- */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Server error";
  res.status(status).json({ error: message });
});

/* --------------------------------- Start ---------------------------------- */
async function start() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }
  if (!process.env.JWT_ACCESS_SECRET) {
    console.error("Falta JWT_ACCESS_SECRET en .env");
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    console.error("Falta JWT_REFRESH_SECRET en .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB conectado");

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`API escuchando en :${port}`));
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});

export default app;
