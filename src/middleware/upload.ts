
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 

const baseDir = path.resolve(process.cwd(), "uploads");

fs.mkdirSync(baseDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, baseDir);
  },
  filename: (_req, file, cb) => {
   
    const ts = Date.now();
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}-${safeOriginal}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
 
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Tipo de archivo no permitido. Usa JPG, PNG o WEBP."));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});
