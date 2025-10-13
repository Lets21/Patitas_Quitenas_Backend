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
const animals_js_1 = __importDefault(require("./routes/animals.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const users_js_1 = __importDefault(require("./routes/users.js"));
const clinic_js_1 = __importDefault(require("./routes/clinic.js"));
const foundation_js_1 = __importDefault(require("./routes/foundation.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const path_1 = __importDefault(require("path"));
const foundation_animals_js_1 = __importDefault(require("./routes/foundation.animals.js"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
const app = (0, express_1.default)();
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use((0, cors_1.default)({ origin: corsOrigin, credentials: true }));
app.use(express_1.default.json());
const uploadsDir = path_1.default.resolve(process.cwd(), "uploads");
app.use("/uploads", express_1.default.static(uploadsDir));
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
app.use("/api/v1/auth", auth_js_1.default);
app.use("/api/v1/users", users_js_1.default);
app.use("/api/v1/clinic", clinic_js_1.default);
app.use("/api/v1/foundation", foundation_js_1.default);
app.use("/api/v1/admin", admin_js_1.default);
// ✅ SOLO ESTA
app.use("/api/v1/animals", animals_js_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
app.use("/api/v1/foundation/animals", foundation_animals_js_1.default);
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
    console.error("API error:", err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
});
async function start() {
    if (!process.env.MONGODB_URI) {
        console.error("Falta MONGODB_URI en .env");
        process.exit(1);
    }
    if (!process.env.JWT_SECRET) {
        console.error("Falta JWT_SECRET en .env");
        process.exit(1);
    }
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("MongoDB conectado");
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => console.log(`API escuchando en :${port}`));
}
start().catch((err) => {
    console.error("Error al iniciar:", err);
    process.exit(1);
});
exports.default = app;
