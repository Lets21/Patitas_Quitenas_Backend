"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Animal_js_1 = require("../models/Animal.js");
const router = (0, express_1.Router)();
function toFrontendStatus(state) {
    // mapea tus estados a los que usa el front
    // AVAILABLE | RESERVED | ADOPTED  -> available | reserved | adopted
    switch ((state || "").toUpperCase()) {
        case "AVAILABLE": return "available";
        case "RESERVED": return "reserved";
        case "ADOPTED": return "adopted";
        default: return "available";
    }
}
router.get("/", async (_req, res, next) => {
    try {
        const docs = await Animal_js_1.Animal.find().lean();
        const animals = docs.map((d) => ({
            id: String(d._id),
            name: d.name,
            photos: Array.isArray(d.photos) ? d.photos : [],
            // 🔽 aplanamos attributes.*
            age: d.attributes?.age ?? 0,
            size: String(d.attributes?.size || "").toLowerCase(),
            breed: d.attributes?.breed ?? "",
            energy: String(d.attributes?.energy || "").toLowerCase(),
            goodWith: {
                children: !!d.attributes?.coexistence?.children,
                cats: !!d.attributes?.coexistence?.cats,
                dogs: !!d.attributes?.coexistence?.dogs,
            },
            // campos que ya usas en el front
            status: toFrontendStatus(d.state),
            description: d.clinicalSummary ?? "",
            foundation: { name: d.foundationName ?? "Fundación" }, // ajusta si tienes relación
            health: {
                vaccinated: !!d.health?.vaccinated, // si no tienes health en el modelo, deja en false
                sterilized: !!d.health?.sterilized,
                dewormed: !!d.health?.dewormed,
                lastCheckup: d.health?.lastCheckup || d.updatedAt || d.createdAt,
            },
            createdAt: d.createdAt,
        }));
        res.json({ animals, total: animals.length });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
