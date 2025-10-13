"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Animal_js_1 = require("../models/Animal.js");
const ClinicalRecord_js_1 = require("../models/ClinicalRecord.js");
const verifyJWT_js_1 = require("../middleware/verifyJWT.js");
const requireRole_js_1 = require("../middleware/requireRole.js");
const upload_js_1 = require("../middleware/upload.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Convierte ruta absoluta de archivo en URL pública servida por express.static("/uploads")
function publicPath(localFullPath) {
    const norm = localFullPath.replace(/\\/g, "/");
    const idx = norm.lastIndexOf("/uploads/");
    return idx >= 0 ? norm.slice(idx) : norm;
}
// LISTAR perros de mi fundación
router.get("/", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), async (req, res, next) => {
    try {
        const foundationId = req.user.id; // ← ya viene normalizado del middleware
        const animals = await Animal_js_1.Animal.find({ foundationId }).sort({ createdAt: -1 }).lean();
        res.json({ animals, total: animals.length });
    }
    catch (e) {
        next(e);
    }
});
// CREAR perro (con fotos)
router.post("/", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("photos", 6), async (req, res, next) => {
    try {
        const foundationId = req.user.id;
        const { name, clinicalSummary, state } = req.body;
        const attributes = req.body?.attributes ? JSON.parse(req.body.attributes) : {};
        const photos = req.files?.map((f) => publicPath(f.path)) || [];
        const doc = await Animal_js_1.Animal.create({
            name,
            photos,
            attributes,
            clinicalSummary: clinicalSummary || "",
            state: state || "AVAILABLE",
            foundationId,
        });
        res.status(201).json({ data: doc });
    }
    catch (e) {
        next(e);
    }
});
// ACTUALIZAR perro (puede subir nuevas fotos)
router.patch("/:id", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("photos", 6), async (req, res, next) => {
    try {
        const foundationId = req.user.id;
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId))
            return res.status(403).json({ error: "Forbidden" });
        const updates = {};
        if (req.body.name !== undefined)
            updates.name = req.body.name;
        if (req.body.clinicalSummary !== undefined)
            updates.clinicalSummary = req.body.clinicalSummary;
        if (req.body.state !== undefined)
            updates.state = req.body.state;
        if (req.body.attributes !== undefined)
            updates.attributes = JSON.parse(req.body.attributes);
        const newPhotos = req.files?.map((f) => publicPath(f.path)) || [];
        // Mantener fotos existentes si viene keepPhotos (opcional)
        if (req.body.keepPhotos) {
            const keep = JSON.parse(req.body.keepPhotos);
            updates.photos = [...(animal.photos || [])].filter((p) => keep.includes(p));
        }
        else {
            updates.photos = animal.photos || [];
        }
        if (newPhotos.length) {
            updates.photos = [...(updates.photos || []), ...newPhotos];
        }
        const updated = await Animal_js_1.Animal.findByIdAndUpdate(id, updates, { new: true });
        res.json({ data: updated });
    }
    catch (e) {
        next(e);
    }
});
// BORRAR perro
router.delete("/:id", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), async (req, res, next) => {
    try {
        const foundationId = req.user.id;
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId))
            return res.status(403).json({ error: "Forbidden" });
        // (Opcional) borrar fotos del disco
        for (const p of animal.photos || []) {
            if (p.startsWith("/uploads/")) {
                const full = path_1.default.join(process.cwd(), p);
                if (fs_1.default.existsSync(full))
                    fs_1.default.unlinkSync(full);
            }
        }
        await animal.deleteOne();
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// ACTUALIZAR ficha clínica básica (fundación)
router.post("/:id/clinical", verifyJWT_js_1.verifyJWT, (0, requireRole_js_1.requireRole)("FUNDACION"), upload_js_1.upload.array("evidence", 6), async (req, res, next) => {
    try {
        const foundationId = req.user.id;
        const { id } = req.params;
        const animal = await Animal_js_1.Animal.findById(id);
        if (!animal)
            return res.status(404).json({ error: "Not found" });
        if (String(animal.foundationId) !== String(foundationId))
            return res.status(403).json({ error: "Forbidden" });
        const payload = req.body?.record ? JSON.parse(req.body.record) : {};
        const record = await ClinicalRecord_js_1.ClinicalRecord.findOneAndUpdate({ animalId: id }, { ...payload, approved: false, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.json({ data: record });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
