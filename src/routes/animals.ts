import { Router } from "express";
import { Animal } from "../models/Animal.js";

const router = Router();

function toFrontendStatus(state?: string) {
  // mapea tus estados a los que usa el front
  // AVAILABLE | RESERVED | ADOPTED  -> available | reserved | adopted
  switch ((state || "").toUpperCase()) {
    case "AVAILABLE": return "available";
    case "RESERVED":  return "reserved";
    case "ADOPTED":   return "adopted";
    default:          return "available";
  }
}

router.get("/", async (_req, res, next) => {
  try {
    const docs = await Animal.find().lean();

    const animals = docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      photos: Array.isArray(d.photos) ? d.photos : [],
      // 🔽 aplanamos attributes.*
      age: d.attributes?.age ?? 0,
      size: String(d.attributes?.size || "").toLowerCase() as "small" | "medium" | "large",
      breed: d.attributes?.breed ?? "",
      energy: String(d.attributes?.energy || "").toLowerCase() as "low" | "medium" | "high",
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
        vaccinated: !!d.health?.vaccinated,     // si no tienes health en el modelo, deja en false
        sterilized:  !!d.health?.sterilized,
        dewormed:    !!d.health?.dewormed,
        lastCheckup: d.health?.lastCheckup || d.updatedAt || d.createdAt,
      },
      createdAt: d.createdAt,
    }));

    res.json({ animals, total: animals.length });
  } catch (e) {
    next(e);
  }
});

export default router;
