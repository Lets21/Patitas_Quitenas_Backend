// backend/src/middleware/upload.ts
import type { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

const baseDir = path.resolve(__dirname, "..", "..", "uploads");
fs.mkdirSync(baseDir, { recursive: true });

const storage = multer.diskStorage({
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
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const ok = /^(image\/jpeg|image\/png|image\/webp|image\/jpg)$/i.test(file.mimetype);
  // No mandamos Error en el primer arg para evitar la incompatibilidad de tipos
  cb(null, ok);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
