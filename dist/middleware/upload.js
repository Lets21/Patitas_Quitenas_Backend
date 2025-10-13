"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// backend/src/middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
// === __dirname para ESM ===
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Carpeta base donde guardaremos archivos subidos.
// Puedes usar process.cwd() o partir desde este archivo.
const baseDir = path_1.default.resolve(process.cwd(), "uploads");
// const baseDir = path.join(__dirname, "..", "..", "uploads"); // alternativo también válido
fs_1.default.mkdirSync(baseDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, baseDir);
    },
    filename: (_req, file, cb) => {
        // nombre: 1712345678901-original.ext
        const ts = Date.now();
        const safeOriginal = file.originalname.replace(/\s+/g, "_");
        cb(null, `${ts}-${safeOriginal}`);
    },
});
const fileFilter = (_req, file, cb) => {
    // Acepta solo imágenes
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype))
        return cb(null, true);
    cb(new Error("Tipo de archivo no permitido. Usa JPG, PNG o WEBP."));
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
