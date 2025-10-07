// backend/src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import animalsRoutes from "./routes/animals.js";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

import clinicRoutes from "./routes/clinic.js";
import foundationRoutes from "./routes/foundation.js";
import adminRoutes from "./routes/admin.js";
import path from "path";
import foundationAnimalsRoutes from "./routes/foundation.animals.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
const uploadsDir = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);

app.use("/api/v1/clinic", clinicRoutes);
app.use("/api/v1/foundation", foundationRoutes);
app.use("/api/v1/admin", adminRoutes);

// ✅ SOLO ESTA
app.use("/api/v1/animals", animalsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/v1/foundation/animals", foundationAnimalsRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

async function start() {
  if (!process.env.MONGODB_URI) { console.error("Falta MONGODB_URI en .env"); process.exit(1); }
  if (!process.env.JWT_SECRET) { console.error("Falta JWT_SECRET en .env"); process.exit(1); }

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
