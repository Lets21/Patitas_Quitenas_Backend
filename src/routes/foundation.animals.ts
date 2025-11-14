// backend/src/routes/foundation.animals.ts
import { Router } from "express";
import { Animal } from "../models/Animal";
import { ClinicalRecord } from "../models/ClinicalRecord";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import { upload } from "../middleware/upload";
import { getFoundationAnimals } from "../controllers/foundationAnimals";
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

// Valida y sanitiza personality (1-5)
function sanitizePersonality(personality: any): any {
  if (!personality || typeof personality !== "object") return undefined;
  const result: any = {};
  const fields = ["sociability", "energy", "training", "adaptability"];
  for (const field of fields) {
    if (personality[field] !== undefined && personality[field] !== null) {
      const val = Number(personality[field]);
      if (!isNaN(val) && val >= 1 && val <= 5) {
        result[field] = Math.round(val);
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// Valida y sanitiza compatibility (booleans)
function sanitizeCompatibility(compatibility: any): any {
  if (!compatibility || typeof compatibility !== "object") return undefined;
  const result: any = {};
  const fields = ["kids", "cats", "dogs", "apartment"];
  for (const field of fields) {
    if (compatibility[field] !== undefined && compatibility[field] !== null) {
      result[field] = Boolean(compatibility[field]);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// Valida y sanitiza clinicalHistory
function sanitizeClinicalHistory(clinicalHistory: any): any {
  if (!clinicalHistory || typeof clinicalHistory !== "object") return undefined;
  const result: any = {};
  if (clinicalHistory.lastVaccination !== undefined && clinicalHistory.lastVaccination !== null) {
    result.lastVaccination = String(clinicalHistory.lastVaccination);
  }
  if (clinicalHistory.sterilized !== undefined && clinicalHistory.sterilized !== null) {
    result.sterilized = Boolean(clinicalHistory.sterilized);
  }
  if (clinicalHistory.conditions !== undefined && clinicalHistory.conditions !== null) {
    result.conditions = String(clinicalHistory.conditions);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// Extrae los nuevos campos desde body o desde el campo "extra" (JSON string)
function extractExtraFields(body: any): { personality?: any; compatibility?: any; clinicalHistory?: any } {
  let extra: any = {};
  
  // Intentar leer desde el campo "extra" (JSON string en multipart/form-data)
  if (body.extra) {
    const parsed = safeJsonParse(body.extra, null);
    if (parsed && typeof parsed === "object" && parsed !== null) {
      extra = { ...extra, ...(parsed as Record<string, any>) };
    }
  }
  
  // También aceptar campos directos (JSON plano o multipart con campos planos)
  if (body.personality) extra.personality = body.personality;
  if (body.compatibility) extra.compatibility = body.compatibility;
  if (body.clinicalHistory) extra.clinicalHistory = body.clinicalHistory;
  
  return {
    personality: sanitizePersonality(extra.personality),
    compatibility: sanitizeCompatibility(extra.compatibility),
    clinicalHistory: sanitizeClinicalHistory(extra.clinicalHistory),
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/v1/foundation/animals                                             */
/* Lista los animales de la fundación autenticada con paginación y filtros.   */
/* Usa el controller getFoundationAnimals que devuelve formato completo       */
/* -------------------------------------------------------------------------- */
router.get("/", verifyJWT, requireRole("FUNDACION"), getFoundationAnimals);

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

      // Extraer y validar campos adicionales (personality, compatibility, clinicalHistory)
      const extraFields = extractExtraFields(req.body);

      const doc = await Animal.create({
        name,
        photos,
        attributes,
        clinicalSummary,
        state,
        foundationId,
        ...extraFields,
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

      // Extraer y validar campos adicionales (personality, compatibility, clinicalHistory)
      const extraFields = extractExtraFields(body);
      if (extraFields.personality !== undefined) updates.personality = extraFields.personality;
      if (extraFields.compatibility !== undefined) updates.compatibility = extraFields.compatibility;
      if (extraFields.clinicalHistory !== undefined) updates.clinicalHistory = extraFields.clinicalHistory;

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
