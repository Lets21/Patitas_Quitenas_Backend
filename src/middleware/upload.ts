// backend/src/middleware/upload.ts
import type { Request } from "express";
import multer, { FileFilterCallback } from "multer";

// Usamos memoria temporal para Cloudinary
const storage = multer.memoryStorage();

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
