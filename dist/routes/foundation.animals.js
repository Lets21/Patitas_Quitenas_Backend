"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/foundation.animals.ts
const express_1 = require("express");
const Animal_js_1 = require("../models/Animal.js");
const ClinicalRecord_js_1 = require("../models/ClinicalRecord.js");
const verifyJWT_js_1 = require("../middleware/verifyJWT.js");
const requireRole_js_1 = require("../middleware/requireRole.js");
const upload_js_1 = require("../middleware/upload.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
// Convierte ruta absoluta de archivo en URL pública servida por express.static("/uploads")
function publicPath(localFullPath) {
    const norm = localFullPath.replace(/\\/g, "/");
    const idx = norm.lastIndexOf("/uploads/");
    return idx >= 0 ? norm.slice(idx) : norm;
}
// Obtiene id de usuario de forma tolerante (id | _id | sub)
function getUserId(req) {
    const u = req.user || {};
    return ((typeof u.id === "string" && u.id) ||
        (typeof u._id === "string" && u._id) ||
        (typeof u.sub === "string" && u.sub) ||
        null);
}
// Intenta parsear JSON; si falla, devuelve fallback
function safeJsonParse(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value !== "string")
        return value;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
/* -------------------------------------------------------------------------- */
/* GET /api/v1/foundation/animals                                             */
/* Lista los animales de la fundación autenticada.                            */
/* Devuelve { animals, total }                                                */
/* -------------------------------------------------------------------------- */
router.get("/", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), async (req, res, next) => {
    try {
        const foundationId = getUserId(req);
        if (!foundationId)
            return res.status(401).json({ error: "No se pudo determinar el usuario" });
        const animals = await Animal_js_1.Animal.find({ foundationId }).sort({ createdAt: -1 }).lean();
        return res.json({ animals, total: animals.length });
    }
    catch (e) {
        next(e);
    }
});
/* -------------------------------------------------------------------------- */
/* POST /api/v1/foundation/animals                                            */
/* Crea un animal (multipart o JSON). Fuerza foundationId desde el token.     */
/* Body esperado (multipart/JSON):                                            */
/* - name, clinicalSummary, state                                             */
/* - attributes: JSON { age,size,breed,gender,energy,coexistence{...} }       */
/* - photos: files[] (campo "photos")                                         */
/* Respuesta: { data: Animal }                                                */
/* -------------------------------------------------------------------------- */
router.post("/", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("photos", 6), async (req, res, next) => {
    try {
        const foundationId = getUserId(req);
        if (!foundationId)
            return res.status(401).json({ error: "No se pudo determinar el usuario" });
        const { name = "", clinicalSummary = "", state = "AVAILABLE" } = req.body;
        const attributes = safeJsonParse(req.body?.attributes, {});
        const photos = req.files?.map((f) => publicPath(f.path)) || [];
        const doc = await Animal_js_1.Animal.create({
            name,
            photos,
            attributes,
            clinicalSummary,
            state,
            foundationId,
        });
        return res.status(201).json({ data: doc });
    }
    catch (e) {
        next(e);
    }
});
/* -------------------------------------------------------------------------- */
/* PATCH /api/v1/foundation/animals/:id                                       */
/* Actualiza si el animal pertenece a la fundación.                           */
/* Acepta multipart/JSON.                                                     */
/* - Puede enviar "keepPhotos" (JSON array) para conservar las actuales       */
/* - Puede adjuntar nuevas fotos en "photos"                                  */
/* Respuesta: { data: Animal }                                                */
/* -------------------------------------------------------------------------- */
router.patch("/:id", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("photos", 6), async (req, res, next) => {
    try {
        const foundationId = getUserId(req);
        if (!foundationId)
            return res.status(401).json({ error: "No se pudo determinar el usuario" });
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const body = { ...req.body };
        const updates = {};
        if (body.name !== undefined)
            updates.name = body.name;
        if (body.clinicalSummary !== undefined)
            updates.clinicalSummary = body.clinicalSummary;
        if (body.state !== undefined)
            updates.state = body.state;
        if (body.attributes !== undefined)
            updates.attributes = safeJsonParse(body.attributes, body.attributes);
        const newPhotos = req.files?.map((f) => publicPath(f.path)) || [];
        // Manejo de fotos actuales
        const keepPhotos = safeJsonParse(body.keepPhotos, null);
        if (Array.isArray(keepPhotos)) {
            updates.photos = (animal.photos || []).filter((p) => keepPhotos.includes(p));
        }
        else {
            updates.photos = animal.photos || [];
        }
        if (newPhotos.length) {
            updates.photos = [...(updates.photos || []), ...newPhotos];
        }
        const updated = await Animal_js_1.Animal.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        return res.json({ data: updated });
    }
    catch (e) {
        next(e);
    }
});
/* -------------------------------------------------------------------------- */
/* DELETE /api/v1/foundation/animals/:id                                      */
/* Elimina si pertenece a la fundación.                                       */
/* Opcionalmente borra del disco las fotos en /uploads                        */
/* Respuesta: { ok: true }                                                    */
/* -------------------------------------------------------------------------- */
router.delete("/:id", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), async (req, res, next) => {
    try {
        const foundationId = getUserId(req);
        if (!foundationId)
            return res.status(401).json({ error: "No se pudo determinar el usuario" });
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        // (Opcional) borrar fotos del disco
        for (const p of animal.photos || []) {
            if (p?.startsWith?.("/uploads/")) {
                const full = path_1.default.join(process.cwd(), p);
                if (fs_1.default.existsSync(full)) {
                    try {
                        fs_1.default.unlinkSync(full);
                    }
                    catch { /* ignore */ }
                }
            }
        }
        await animal.deleteOne();
        return res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
/* -------------------------------------------------------------------------- */
/* POST /api/v1/foundation/animals/:id/clinical                               */
/* Actualiza la ficha clínica básica (fundación).                             */
/* Body: record (JSON), evidence (files opcional)                             */
/* Respuesta: { data: ClinicalRecord }                                        */
/* -------------------------------------------------------------------------- */
router.post("/:id/clinical", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("evidence", 6), async (req, res, next) => {
    try {
        const foundationId = getUserId(req);
        if (!foundationId)
            return res.status(401).json({ error: "No se pudo determinar el usuario" });
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const payload = safeJsonParse(req.body?.record, {});
        // Si quisieras registrar URLs de evidencias, podrías mapear aquí:
        // const evidence = (req.files as Express.Multer.File[] | undefined)?.map(f => publicPath(f.path)) || [];
        const record = await ClinicalRecord_js_1.ClinicalRecord.findOneAndUpdate({ animalId: id }, { ...payload, approved: false, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.json({ data: record });
    }
    catch (e) {
        next(e);
    }
});
router.get("/__ping", (req, res) => {
    res.json({ ok: true, who: "foundation.animals.ts" });
});
exports.default = router;
//# sourceMappingURL=foundation.animals.js.map