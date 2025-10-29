"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const baseDir = path_1.default.resolve(__dirname, "..", "..", "uploads");
fs_1.default.mkdirSync(baseDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination(_req, _file, cb) {
        cb(null, baseDir);
    },
    filename(_req, file, cb) {
        const ts = Date.now();
        const safeOriginal = file.originalname.replace(/\s+/g, "_");
        cb(null, `${ts}-${safeOriginal}`);
    },
});
// Firma EXACTA que espera Multer
const fileFilter = (_req, file, cb) => {
    const ok = /^(image\/jpeg|image\/png|image\/webp|image\/jpg)$/i.test(file.mimetype);
    // No mandamos Error en el primer arg para evitar la incompatibilidad de tipos
    cb(null, ok);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
//# sourceMappingURL=upload.js.map