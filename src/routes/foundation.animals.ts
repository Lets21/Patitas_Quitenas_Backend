import { Router } from "express";
import { Animal } from "../models/Animal";
import { ClinicalRecord } from "../models/ClinicalRecord";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import { upload } from "../middleware/upload";
import fs from "fs";
import path from "path";

const router = Router();

// Convierte ruta absoluta de archivo en URL pública servida por express.static("/uploads")
function publicPath(localFullPath: string) {
  const norm = localFullPath.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/uploads/");
  return idx >= 0 ? norm.slice(idx) : norm;
}

// LISTAR perros de mi fundación
router.get("/", verifyJWT, requireRole("FUNDACION"), async (req, res, next) => {
  try {
    const foundationId = req.user!.id; // ← ya viene normalizado del middleware
    const animals = await Animal.find({ foundationId }).sort({ createdAt: -1 }).lean();
    res.json({ animals, total: animals.length });
  } catch (e) {
    next(e);
  }
});

// CREAR perro (con fotos)
router.post(
  "/",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("photos", 6),
  async (req, res, next) => {
    try {
      const foundationId = req.user!.id;

      const { name, clinicalSummary, state } = req.body;
      const attributes = req.body?.attributes ? JSON.parse(req.body.attributes) : {};

      const photos: string[] =
        (req.files as Express.Multer.File[] | undefined)?.map((f) => publicPath(f.path)) || [];

      const doc = await Animal.create({
        name,
        photos,
        attributes,
        clinicalSummary: clinicalSummary || "",
        state: state || "AVAILABLE",
        foundationId,
      });

      res.status(201).json({ data: doc });
    } catch (e) {
      next(e);
    }
  }
);

// ACTUALIZAR perro (puede subir nuevas fotos)
router.patch(
  "/:id",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("photos", 6),
  async (req, res, next) => {
    try {
      const foundationId = req.user!.id;
      const { id } = req.params;

      const animal = await Animal.findById(id);
      if (!animal) return res.status(404).json({ error: "Not found" });
      if (String(animal.foundationId) !== String(foundationId))
        return res.status(403).json({ error: "Forbidden" });

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.clinicalSummary !== undefined) updates.clinicalSummary = req.body.clinicalSummary;
      if (req.body.state !== undefined) updates.state = req.body.state;
      if (req.body.attributes !== undefined) updates.attributes = JSON.parse(req.body.attributes);

      const newPhotos =
        (req.files as Express.Multer.File[] | undefined)?.map((f) => publicPath(f.path)) || [];

      // Mantener fotos existentes si viene keepPhotos (opcional)
      if (req.body.keepPhotos) {
        const keep: string[] = JSON.parse(req.body.keepPhotos);
        updates.photos = [...(animal.photos || [])].filter((p) => keep.includes(p));
      } else {
        updates.photos = animal.photos || [];
      }

      if (newPhotos.length) {
        updates.photos = [...(updates.photos || []), ...newPhotos];
      }

      const updated = await Animal.findByIdAndUpdate(id, updates, { new: true });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  }
);

// BORRAR perro
router.delete("/:id", verifyJWT, requireRole("FUNDACION"), async (req, res, next) => {
  try {
    const foundationId = req.user!.id;
    const { id } = req.params;

    const animal = await Animal.findById(id);
    if (!animal) return res.status(404).json({ error: "Not found" });
    if (String(animal.foundationId) !== String(foundationId))
      return res.status(403).json({ error: "Forbidden" });

    // (Opcional) borrar fotos del disco
    for (const p of animal.photos || []) {
      if (p.startsWith("/uploads/")) {
        const full = path.join(process.cwd(), p);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      }
    }

    await animal.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ACTUALIZAR ficha clínica básica (fundación)
router.post(
  "/:id/clinical",
  verifyJWT,
  requireRole("FUNDACION"),
  upload.array("evidence", 6),
  async (req, res, next) => {
    try {
      const foundationId = req.user!.id;
      const { id } = req.params;

      const animal = await Animal.findById(id);
      if (!animal) return res.status(404).json({ error: "Not found" });
      if (String(animal.foundationId) !== String(foundationId))
        return res.status(403).json({ error: "Forbidden" });

      const payload = req.body?.record ? JSON.parse(req.body.record) : {};

      const record = await ClinicalRecord.findOneAndUpdate(
        { animalId: id },
        { ...payload, approved: false, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json({ data: record });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
