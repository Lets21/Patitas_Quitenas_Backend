// backend/src/middleware/upload.ts
import type { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Callback con la firma que necesitamos, sin pelear con @types/multer
type MyFileFilterCb = (error: Error | null, acceptFile: boolean) => void;

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

const fileFilter = (_req: Request, file: Express.Multer.File, cb: MyFileFilterCb): void => {
  const ok = /^(image\/jpeg|image\/png|image\/webp|image\/jpg)$/i.test(file.mimetype);
  if (ok) return cb(null, true);
  return cb(new Error("Tipo de archivo no permitido. Usa JPG, PNG o WEBP."), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
