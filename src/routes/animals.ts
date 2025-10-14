import { Router, Request, Response, NextFunction } from "express";
import { Animal } from "../models/Animal"; // sin .js en TS

const router = Router();

/* Helpers para enums en MAYÚSCULAS */
type Size = "SMALL" | "MEDIUM" | "LARGE";
type Energy = "LOW" | "MEDIUM" | "HIGH";
type Gender = "MALE" | "FEMALE";
type AState = "AVAILABLE" | "RESERVED" | "ADOPTED" | "RESCUED" | "QUARANTINE";

const toSize = (v: any): Size => {
  const s = String(v || "").toUpperCase();
  return (["SMALL", "MEDIUM", "LARGE"].includes(s) ? s : "MEDIUM") as Size;
};
const toEnergy = (v: any): Energy => {
  const s = String(v || "").toUpperCase();
  return (["LOW", "MEDIUM", "HIGH"].includes(s) ? s : "MEDIUM") as Energy;
};
const toGender = (v: any): Gender => {
  const s = String(v || "").toUpperCase();
  return (s === "MALE" || s === "FEMALE" ? s : "FEMALE") as Gender;
};
const toState = (v: any): AState => {
  const s = String(v || "").toUpperCase();
  const ok = ["AVAILABLE", "RESERVED", "ADOPTED", "RESCUED", "QUARANTINE"];
  return (ok.includes(s) ? s : "AVAILABLE") as AState;
};

/**
 * GET /api/v1/animals
 * Devuelve { animals, total } con la forma que consume el front.
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await Animal.find().lean();

    const animals = (docs as any[]).map((d) => {
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
  } catch (err) {
    next(err);
  }
});

export default router;
