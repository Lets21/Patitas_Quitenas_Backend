"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Middlewares
const auth_1 = require("./middleware/auth");
// Rutas
const animals_1 = __importDefault(require("./routes/animals"));
const auth_2 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const clinic_1 = __importDefault(require("./routes/clinic"));
const foundation_1 = __importDefault(require("./routes/foundation"));
const admin_1 = __importDefault(require("./routes/admin"));
const foundation_animals_1 = __importDefault(require("./routes/foundation.animals"));
const app = (0, express_1.default)();
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
const corsDelegate = (req, cb) => {
    const origin = req.headers.origin || "";
    const allow = !origin || allowedFromEnv.includes(origin) || vercelPreview.test(origin);
    const opts = {
        origin: allow,
        credentials: true,
        methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
    cb(null, opts);
};
app.use((0, cors_1.default)(corsDelegate));
app.options("*", (0, cors_1.default)(corsDelegate));
app.use((_req, res, next) => {
    res.header("Vary", "Origin");
    next();
});
/* --------------------------- Parsers & static --------------------------- */
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// __dirname en runtime ≈ dist/src ⇒ subo 1 nivel a dist/
const uploadsDir = path_1.default.resolve(__dirname, "..", "uploads");
app.use("/uploads", express_1.default.static(uploadsDir));
/* -------------------------------- Health -------------------------------- */
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
/* --------------------------------- Rutas --------------------------------- */
// Público
app.use("/api/v1/auth", auth_2.default);
app.use("/api/v1/animals", animals_1.default); // catálogo público
// Protegidas por rol
app.use("/api/v1/users", auth_1.requireAuth, users_1.default);
app.use("/api/v1/clinic", auth_1.requireAuth, clinic_1.default);
app.use("/api/v1/admin", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_1.default);
/**
 * ⚠️ IMPORTANTE: Montar PRIMERO la subruta específica de animales de fundación
 * para evitar colisiones con el router base de fundación.
 */
app.use("/api/v1/foundation/animals", auth_1.requireAuth, (0, auth_1.requireRole)("FUNDACION"), foundation_animals_1.default);
/** Luego el router base de fundación (NO debe volver a definir '/animals') */
app.use("/api/v1/foundation", auth_1.requireAuth, (0, auth_1.requireRole)("FUNDACION"), foundation_1.default);
/* ---------------------------------- 404 ---------------------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
/* ------------------------------ Error handler ---------------------------- */
app.use((err, _req, res, _next) => {
    console.error("API error:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || "Server error" });
});
/* --------------------------------- Start -------------------------------- */
async function start() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("Falta MONGODB_URI en .env");
        process.exit(1);
    }
    if (!process.env.JWT_ACCESS_SECRET && !process.env.JWT_SECRET) {
        console.error("Falta JWT_ACCESS_SECRET o JWT_SECRET en .env");
        process.exit(1);
    }
    // JWT_REFRESH_SECRET opcional si no usas refresh
    await mongoose_1.default.connect(mongoUri);
    console.log("MongoDB conectado");
    const PORT = Number(process.env.PORT ?? 4000); // default 4000 para el front
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`API listening on http://localhost:${PORT}`);
    });
}
start().catch((err) => {
    console.error("Error al iniciar:", err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map