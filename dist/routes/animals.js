"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/animals.ts
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Animal_1 = require("../models/Animal"); // sin .js en TS
const router = (0, express_1.Router)();
const toSize = (v) => {
    const s = String(v || "").toUpperCase();
    return (["SMALL", "MEDIUM", "LARGE"].includes(s) ? s : "MEDIUM");
};
const toEnergy = (v) => {
    const s = String(v || "").toUpperCase();
    return (["LOW", "MEDIUM", "HIGH"].includes(s) ? s : "MEDIUM");
};
const toGender = (v) => {
    const s = String(v || "").toUpperCase();
    return (s === "MALE" || s === "FEMALE" ? s : "FEMALE");
};
const toState = (v) => {
    const s = String(v || "").toUpperCase();
    const ok = ["AVAILABLE", "RESERVED", "ADOPTED", "RESCUED", "QUARANTINE"];
    return (ok.includes(s) ? s : "AVAILABLE");
};
/** Normalizador común (listado y detalle) */
function mapDocToDto(d) {
    const attrs = d?.attributes || {};
    return {
        id: String(d._id),
        name: d.name ?? "Sin nombre",
        photos: Array.isArray(d.photos) ? d.photos : [],
        clinicalSummary: String(d.clinicalSummary ?? ""),
        state: toState(d.state),
        attributes: {
            age: Number(attrs.age ?? d.age ?? 0),
            size: toSize(attrs.size ?? d.size),
            breed: String(attrs.breed ?? d.breed ?? "Mestizo"),
            gender: toGender(attrs.gender ?? d.gender),
            energy: toEnergy(attrs.energy ?? d.energy),
            coexistence: {
                children: Boolean(attrs?.coexistence?.children ?? d?.goodWith?.children ?? false),
                cats: Boolean(attrs?.coexistence?.cats ?? d?.goodWith?.cats ?? false),
                dogs: Boolean(attrs?.coexistence?.dogs ?? d?.goodWith?.dogs ?? false),
            },
        },
        foundationId: d.foundationId ?? undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}
/**
 * GET /api/v1/animals
 * Devuelve { animals, total } con la forma que consume el front.
 */
router.get("/", async (_req, res, next) => {
    try {
        const docs = await Animal_1.Animal.find().lean();
        const animals = docs.map(mapDocToDto);
        res.json({ animals, total: animals.length });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/animals/:id
 * Detalle público: usa el mismo normalizador que el listado.
 */
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validación segura de ObjectId
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(404).json({ error: "Not found" });
        }
        const doc = await Animal_1.Animal.findById(id).lean();
        if (!doc) {
            return res.status(404).json({ error: "Not found" });
        }
        res.json(mapDocToDto(doc));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=animals.js.map