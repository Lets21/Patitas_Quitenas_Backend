// src/routes/applications.ts
import { Router, Request, Response, NextFunction } from "express";
import { Application } from "../models/Application";
import { Animal } from "../models/Animal";
import { requireAuth } from "../middleware/auth";

const router = Router();

// --- Helpers: normalizar strings del form a los enum esperados ---
function norm(s?: string) {
  return String(s ?? "").trim().toLowerCase();
}
function normalizeForm(raw: any = {}) {
  const homeMap: Record<string, string> = {
    "casa": "casa",
    "house": "casa",
    "departamento": "departamento",
    "apartment": "departamento",
    "depa": "departamento",
    "otro": "otro",
    "other": "otro",
  };

  const petsMap: Record<string, string> = {
    "ninguno": "ninguno",
    "ninguna": "ninguno",
    "none": "ninguno",
    "perro": "perro",
    "perros": "perro",
    "dog": "perro",
    "dogs": "perro",
    "gato": "gato",
    "gatos": "gato",
    "cat": "gato",
    "cats": "gato",
    "ambos": "ambos",
    "both": "ambos",
  };

  const actMap: Record<string, "bajo" | "medio" | "alto"> = {
    "bajo": "bajo",
    "low": "bajo",
    "medio": "medio",
    "medium": "medio",
    "alto": "alto",
    "high": "alto",
  };

  const budgetMap: Record<string, "básico" | "medio" | "alto"> = {
    "básico": "básico",
    "basico": "básico",
    "basic": "básico",
    "medio": "medio",
    "medium": "medio",
    "alto": "alto",
    "high": "alto",
  };

  const expMap: Record<string, "primera_vez" | "con_experiencia"> = {
    "primera vez": "primera_vez",
    "primeravez": "primera_vez",
    "first time": "primera_vez",
    "first_time": "primera_vez",
    "con experiencia": "con_experiencia",
    "con_experiencia": "con_experiencia",
    "experienced": "con_experiencia",
  };

  const homeType = homeMap[norm(raw.homeType)] ?? undefined;
  const otherPets = petsMap[norm(raw.otherPets)] ?? undefined;
  const activityLevel = actMap[norm(raw.activityLevel)] ?? undefined;
  const budget = budgetMap[norm(raw.budget)] ?? undefined;

  const expKey = norm(raw.experience).replace(/\s+/g, " ");
  const experience = expMap[expKey] ?? undefined;

  return {
    homeType,
    hasYard: Boolean(raw.hasYard),
    hasChildren: Boolean(raw.hasChildren),
    otherPets,
    activityLevel,
    hoursAway: Number.isFinite(Number(raw.hoursAway)) ? Number(raw.hoursAway) : undefined,
    budget,
    experience,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}

// POST /api/v1/applications (solo ADOPTANTE)
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser: any = (req as any).user || {};
    const role = authUser.role;
    const adopterId = authUser.id || authUser._id || authUser.sub; // robusto

    if (!adopterId || role !== "ADOPTANTE") {
      return res.status(403).json({ error: "Solo adoptantes pueden aplicar" });
    }

    const { animalId, form } = req.body || {};
    if (!animalId) return res.status(400).json({ error: "animalId es requerido" });

    // buscar animal para obtener foundationId
    const animal = await Animal.findById(animalId).lean();
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const foundationId = (animal as any).foundationId;
    if (!foundationId) {
      return res.status(400).json({ error: "El animal no tiene foundationId asociado" });
    }

    const normalizedForm = normalizeForm(form);

    const created = await Application.create({
      animalId,
      adopterId,          // << del token
      foundationId,       // << del animal
      form: normalizedForm,
      status: "RECEIVED",
    });

    res.status(201).json({ application: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/applications/mine (ADOPTANTE)
// src/routes/applications.ts
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const u: any = (req as any).user || {};
    const adopterId = u.id || u._id || u.sub;

    const list = await Application
      .find({ adopterId })
      .populate("animalId", "name photos attributes")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: list, total: list.length });
  } catch (e) { next(e); }
});


// GET /api/v1/applications?status=... (FUNDACION/ADMIN)
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u: any = (req as any).user || {};
    const q: any = {};
    if (u.role === "FUNDACION") q.foundationId = u.id || u._id || u.sub;
    if (req.query.status) q.status = String(req.query.status);

    const list = await Application
      .find(q)
      .populate("animalId", "name photos attributes")
      .populate("adopterId", "email profile")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: list, total: list.length });
  } catch (e) { next(e); }
});

// PATCH /api/v1/applications/:id (FUNDACION/ADMIN)
router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body || {};
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status, "form.notes": notes } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
