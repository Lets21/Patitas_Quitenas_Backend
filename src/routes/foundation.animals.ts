// backend/src/routes/foundation.animals.ts
import { Router } from "express";
import { Animal } from "../models/Animal";
import { ClinicalRecord } from "../models/ClinicalRecord";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import { upload } from "../middleware/upload";
import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// Convierte ruta absoluta de archivo en URL pública servida por express.static("/uploads")
function publicPath(localFullPath: string) {
  const norm = localFullPath.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/uploads/");
  return idx >= 0 ? norm.slice(idx) : norm;
}

// Obtiene id de usuario de forma tolerante (id | _id | sub)
function getUserId(req: Request): string | null {
  const u: any = (req as any).user || {};
  return (
    (typeof u.id === "string" && u.id) ||
    (typeof u._id === "string" && u._id) ||
    (typeof u.sub === "string" && u.sub) ||
    null
  );
}

// Intenta parsear JSON; si falla, devuelve fallback
function safeJsonParse<T = any>(value: any, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/* -------------------------------------------------------------------------- */
/* GET /api/v1/foundation/animals                                             */
/* Lista los animales de la fundación autenticada.                            */
/* Devuelve { animals, total }                                                */
/* -------------------------------------------------------------------------- */
router.get("/", verifyJWT, requireRole("FUNDACION"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const foundationId = getUserId(req);
    if (!foundationId) return res.status(401).json({ error: "No se pudo determinar el usuario" });

    const animals = await Animal.find({ foundationId }).sort({ createdAt: -1 }).lean();
    return res.json({ animals, total: animals.length });
  } catch (e) {
    next(e);
  }
});

/* -------------------------------------------------------------------------- */
/* POST /api/v1/foundation/animals                                            */
/* Crea un animal (multipart o JSON). Fuerza foundationId desde el token.     */
/* -------------------------------------------------------------------------- */
router.post(
  "/",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("photos", 6),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const foundationId = getUserId(req);
      if (!foundationId) return res.status(401).json({ error: "No se pudo determinar el usuario" });

      const { name = "", clinicalSummary = "", state = "AVAILABLE" } = req.body as any;
      const attributes = safeJsonParse(req.body?.attributes, {});

      const photos: string[] =
        (req.files as Express.Multer.File[] | undefined)?.map((f) => publicPath(f.path)) || [];

      const doc = await Animal.create({
        name,
        photos,
        attributes,
        clinicalSummary,
        state,
        foundationId,
      });

      return res.status(201).json({ data: doc });
    } catch (e) {
      next(e);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* PATCH /api/v1/foundation/animals/:id                                       */
/* Actualiza si el animal pertenece a la fundación.                           */
/* -------------------------------------------------------------------------- */
router.patch(
  "/:id",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("photos", 6),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const foundationId = getUserId(req);
      if (!foundationId) return res.status(401).json({ error: "No se pudo determinar el usuario" });

      const { id } = req.params;
      const animal = await Animal.findById(id);
      if (!animal) return res.status(404).json({ error: "Not found" });
      if (String(animal.foundationId) !== String(foundationId)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const body: any = { ...req.body };
      const updates: any = {};

      if (body.name !== undefined) updates.name = body.name;
      if (body.clinicalSummary !== undefined) updates.clinicalSummary = body.clinicalSummary;
      if (body.state !== undefined) updates.state = body.state;
      if (body.attributes !== undefined) updates.attributes = safeJsonParse(body.attributes, body.attributes);

      const newPhotos =
        (req.files as Express.Multer.File[] | undefined)?.map((f) => publicPath(f.path)) || [];

      const keepPhotos = safeJsonParse<string[]>(body.keepPhotos, null as any);
      if (Array.isArray(keepPhotos)) {
        updates.photos = (animal.photos || []).filter((p) => keepPhotos.includes(p));
      } else {
        updates.photos = animal.photos || [];
      }

      if (newPhotos.length) {
        updates.photos = [...(updates.photos || []), ...newPhotos];
      }

      const updated = await Animal.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      return res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* DELETE /api/v1/foundation/animals/:id                                      */
/* -------------------------------------------------------------------------- */
router.delete("/:id", verifyJWT, requireRole("FUNDACION"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const foundationId = getUserId(req);
    if (!foundationId) return res.status(401).json({ error: "No se pudo determinar el usuario" });

    const { id } = req.params;
    const animal = await Animal.findById(id);
    if (!animal) return res.status(404).json({ error: "Not found" });
    if (String(animal.foundationId) !== String(foundationId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // (Opcional) borrar fotos del disco
    for (const p of animal.photos || []) {
      if (p?.startsWith?.("/uploads/")) {
        const full = path.join(process.cwd(), p);
        if (fs.existsSync(full)) {
          try { fs.unlinkSync(full); } catch { /* ignore */ }
        }
      }
    }

    await animal.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* -------------------------------------------------------------------------- */
/* POST /api/v1/foundation/animals/:id/clinical                               */
/* -------------------------------------------------------------------------- */
router.post(
  "/:id/clinical",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("evidence", 6),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const foundationId = getUserId(req);
      if (!foundationId) return res.status(401).json({ error: "No se pudo determinar el usuario" });

      const { id } = req.params;
      const animal = await Animal.findById(id);
      if (!animal) return res.status(404).json({ error: "Not found" });
      if (String(animal.foundationId) !== String(foundationId)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const payload = safeJsonParse(req.body?.record, {});

      const record = await ClinicalRecord.findOneAndUpdate(
        { animalId: id },
        { ...payload, approved: false, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({ data: record });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/__ping", (req, res) => {
  res.json({ ok: true, who: "foundation.animals.ts" });
});

export default router;
