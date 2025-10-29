"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
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
/**
 * GET /api/v1/animals
 * Devuelve { animals, total } con la forma que consume el front.
 */
router.get("/", async (_req, res, next) => {
    try {
        const docs = await Animal_1.Animal.find().lean();
        const animals = docs.map((d) => {
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
        });
        res.json({ animals, total: animals.length });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=animals.js.map