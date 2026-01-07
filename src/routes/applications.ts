// src/routes/applications.ts
import { Router, Request, Response, NextFunction } from "express";
import { Application } from "../models/Application";
import { Animal } from "../models/Animal";
import { User } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { verifyJWT } from "../middleware/verifyJWT";
import { scoreApplication } from "../services/scoring/scoreApplication";
import { emailService } from "../services/emailService";
import { dogToMlPayload } from "../ml/dogToMlPayload";
import { predictAdoptionPropensity } from "../services/mlClient";
import mongoose from "mongoose";

const router = Router();

const DEBUG_APPLICATIONS = process.env.DEBUG_APPLICATIONS === "true";
const debugLog = (...args: any[]) => {
  if (DEBUG_APPLICATIONS) {
    console.log(...args);
  }
};

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

  // Normalizar nuevos campos del formulario oficial
  const familyDecisionMap: Record<string, "agree" | "accept" | "indifferent" | "disagree"> = {
    agree: "agree",
    accept: "accept",
    indifferent: "indifferent",
    disagree: "disagree",
  };

  const monthlyBudgetMap: Record<string, "high" | "medium" | "low"> = {
    high: "high",
    medium: "medium",
    low: "low",
  };

  const yesNoMap: Record<string, "yes" | "no"> = {
    yes: "yes",
    no: "no",
  };

  const housingMap: Record<string, "Casa urbana" | "Casa de campo" | "Departamento" | "Quinta" | "Hacienda" | "Otro"> = {
    "Casa urbana": "Casa urbana",
    "Casa de campo": "Casa de campo",
    "Departamento": "Departamento",
    "Quinta": "Quinta",
    "Hacienda": "Hacienda",
    "Otro": "Otro",
  };

  const relationAnimalsMap: Record<string, "positive" | "neutral" | "negative"> = {
    positive: "positive",
    neutral: "neutral",
    negative: "negative",
  };

  const travelPlansMap: Record<string, "withOwner" | "withFamily" | "withFriend" | "paidCaretaker" | "hotel" | "other"> = {
    withOwner: "withOwner",
    withFamily: "withFamily",
    withFriend: "withFriend",
    paidCaretaker: "paidCaretaker",
    hotel: "hotel",
    other: "other",
  };

  const behaviorResponseMap: Record<string, "trainOrAccept" | "seekHelp" | "punish" | "abandon"> = {
    trainOrAccept: "trainOrAccept",
    seekHelp: "seekHelp",
    punish: "punish",
    abandon: "abandon",
  };

  const careCommitmentMap: Record<string, "fullCare" | "mediumCare" | "lowCare"> = {
    fullCare: "fullCare",
    mediumCare: "mediumCare",
    lowCare: "lowCare",
  };

  return {
    // Campos antiguos (mantener compatibilidad)
    homeType,
    hasYard: Boolean(raw.hasYard),
    hasChildren: Boolean(raw.hasChildren),
    otherPets,
    activityLevel,
    hoursAway: Number.isFinite(Number(raw.hoursAway)) ? Number(raw.hoursAway) : undefined,
    budget,
    experience,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    // Nuevos campos del formulario oficial
    familyDecision: familyDecisionMap[norm(raw.familyDecision)] ?? raw.familyDecision,
    monthlyBudget: monthlyBudgetMap[norm(raw.monthlyBudget)] ?? raw.monthlyBudget,
    allowVisits: yesNoMap[norm(raw.allowVisits)] ?? raw.allowVisits,
    acceptSterilization: yesNoMap[norm(raw.acceptSterilization)] ?? raw.acceptSterilization,
    housing: housingMap[raw.housing] ?? raw.housing,
    relationAnimals: relationAnimalsMap[norm(raw.relationAnimals)] ?? raw.relationAnimals,
    travelPlans: travelPlansMap[norm(raw.travelPlans)] ?? raw.travelPlans,
    behaviorResponse: behaviorResponseMap[norm(raw.behaviorResponse)] ?? raw.behaviorResponse,
    careCommitment: careCommitmentMap[norm(raw.careCommitment)] ?? raw.careCommitment,
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

    // Validar que el animal no esté adoptado
    if ((animal as any).state === "ADOPTED") {
      return res.status(400).json({ error: "Este animal ya ha sido adoptado y no está disponible para nuevas solicitudes" });
    }

    const foundationId = (animal as any).foundationId;
    if (!foundationId) {
      return res.status(400).json({ error: "El animal no tiene foundationId asociado" });
    }

    const normalizedForm = normalizeForm(form);

    // Calcular score (animal viene de .lean() así que es un objeto plano)
    const { pct, eligible, detail } = scoreApplication(normalizedForm, animal as any);

    // ========== PREDICCIÓN ML: PROPENSIÓN DE ADOPCIÓN ==========
    let pred: number | null = null;
    let proba: number | null = null;
    let mlExplanation: any = null;

    try {
      console.log("🤖 Llamando al servicio ML para predicción de adopción...");
      const payload = dogToMlPayload(animal);
      console.log("📦 Payload enviado al ML Service (18 características):");
      console.log(JSON.stringify(payload, null, 2));
      
      console.log("\n🔍 VALORES CRÍTICOS DEL PERRO:");
      console.log(`   Nombre: ${animal.name}`);
      console.log(`   Age (meses): ${payload.Age}`);
      console.log(`   Breed1: ${payload.Breed1}`);
      console.log(`   Breed2: ${payload.Breed2}`);
      console.log(`   Gender: ${payload.Gender}`);
      console.log(`   Color1: ${payload.Color1}`);
      console.log(`   MaturitySize: ${payload.MaturitySize}`);
      console.log(`   FurLength: ${payload.FurLength}\n`);
      
      const result = await predictAdoptionPropensity(payload);
      pred = result.pred;
      proba = result.proba_adopta_1;
      mlExplanation = result.explanation;
      
      console.log("✅ Predicción ML recibida:", { 
        pred: pred === 1 ? "1 (Propenso)" : "0 (No propenso)", 
        probabilidad: proba !== null ? `${(proba * 100).toFixed(1)}%` : "N/A",
        vecinos_adoptados: mlExplanation?.adopted_neighbors || "N/A",
        vecinos_no_adoptados: mlExplanation?.not_adopted_neighbors || "N/A"
      });
    } catch (e: any) {
      // No revientes la app si ML falla: registra y sigue
      console.error("⚠️  ML predict error:", e?.response?.data || e.message);
      debugLog("ML service no disponible o error en predicción");
    }

    debugLog("📝 Creando solicitud:", {
      animalId,
      adopterId,
      foundationId,
      scorePct: pct,
      propensityPred: pred,
      propensityProba: proba,
    });

    const created = await Application.create({
      animalId,
      adopterId,          // << del token
      foundationId,       // << del animal
      form: normalizedForm,
      status: "RECEIVED",
      scorePct: pct,
      scoreDetail: detail,
      eligible,
      // Campos ML
      propensityPred: pred,
      propensityProba: proba,
      mlVersion: "knn-v1",
      mlExplanation,
    });

    debugLog("✅ Solicitud creada:", {
      _id: created._id,
      foundationId: created.foundationId,
      adopterId: created.adopterId,
    });

    // Crear notificaciones en base de datos (no bloqueantes)
    Promise.resolve().then(async () => {
      try {
        const { Notification } = require("../models/Notification");
        const adopter = await User.findById(adopterId).lean();
        
        // Notificación para fundación
        await Notification.create({
          foundationId: foundationId,
          type: "adoption",
          title: "Nueva solicitud de adopción",
          message: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} ha enviado una solicitud para adoptar a ${(animal as any).name || ""}`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: (animal as any).name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });

        // Notificación para clínica (global, clinicId: null para todas las clínicas)
        try {
          await Notification.create({
            clinicId: null as any, // null explícito para notificaciones globales de clínica
            type: "adoption",
            title: "Nueva solicitud de adopción",
            message: `Nueva solicitud de adopción para ${(animal as any).name || ""} de ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`,
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
            metadata: {
              animalName: (animal as any).name || "",
              userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
            }
          });
        } catch (clinicNotifErr) {
          console.error("Error creando notificación para clínica:", clinicNotifErr);
        }
      } catch (err) {
        console.error("Error creando notificaciones en BD:", err);
      }
    });

    // Enviar notificaciones por email (no bloqueantes)
    console.log('📧 Iniciando envío de notificaciones por email...');
    Promise.all([
      // 1. Email al adoptante: confirmación de envío
      (async () => {
        try {
          console.log('📨 Preparando email para adoptante...');
          const adopter = await User.findById(adopterId).lean();
          if (adopter) {
            console.log(`📨 Enviando email a adoptante: ${adopter.email}`);
            const result = await emailService.sendApplicationSubmittedEmail({
              to: adopter.email,
              adopterName: `${adopter.profile.firstName} ${adopter.profile.lastName}`,
              animalName: (animal as any).name || "Animal",
              applicationId: String(created._id),
              score: pct,
            });
            console.log(result ? '✅ Email enviado a adoptante' : '❌ Fallo al enviar email a adoptante');
          } else {
            console.log('⚠️  No se encontró el adoptante para enviar email');
          }
        } catch (err: any) {
          console.error("❌ Error enviando email al adoptante:");
          console.error("  Mensaje:", err.message);
          console.error("  Stack:", err.stack);
        }
      })(),
      
      // 2. Email a la fundación: nueva solicitud recibida
      (async () => {
        try {
          console.log('📨 Preparando email para fundación...');
          const foundation = await User.findById(foundationId).lean();
          const adopter = await User.findById(adopterId).lean();
          if (foundation && adopter) {
            console.log(`📨 Enviando email a fundación: ${foundation.email}`);
            const result = await emailService.sendNewApplicationToFoundation({
              to: foundation.email,
              foundationName: foundation.foundationName || foundation.profile.firstName,
              adopterName: `${adopter.profile.firstName} ${adopter.profile.lastName}`,
              adopterEmail: adopter.email,
              animalName: (animal as any).name || "Animal",
              applicationId: String(created._id),
              score: pct,
            });
            console.log(result ? '✅ Email enviado a fundación' : '❌ Fallo al enviar email a fundación');
          } else {
            console.log('⚠️  No se encontró la fundación o adoptante para enviar email');
          }
        } catch (err: any) {
          console.error("❌ Error enviando email a la fundación:");
          console.error("  Mensaje:", err.message);
          console.error("  Stack:", err.stack);
        }
      })(),
    ]).catch(err => {
      console.error("❌ Error general en envío de emails:", err);
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
    
    debugLog("👤 Buscando solicitudes para adoptante ID:", adopterId);

    // Convertir a ObjectId si es string
    const adopterIdQuery = mongoose.Types.ObjectId.isValid(adopterId) 
      ? new mongoose.Types.ObjectId(adopterId) 
      : adopterId;

    // Primero obtener las solicitudes sin populate para tener los IDs
    const rawList = await Application
      .find({ adopterId: adopterIdQuery })
      .select("_id animalId adopterId scorePct status createdAt rejectReason")
      .lean();
    
    // Hacer populate manual para cada solicitud
    const list = await Promise.all(rawList.map(async (app: any) => {
      // Intentar obtener el animal manualmente
      if (app.animalId) {
        try {
          const animalIdObj = mongoose.Types.ObjectId.isValid(app.animalId) 
            ? new mongoose.Types.ObjectId(app.animalId) 
            : app.animalId;
          const animal = await Animal.findById(animalIdObj).select("name photos attributes").lean();
          if (animal) {
            app.animalId = animal;
          } else {
            // Si no existe, mantener el ID pero crear un objeto mínimo
            app.animalId = { _id: app.animalId, name: `Animal (ID: ${app.animalId.toString().substring(0, 8)}...)` };
          }
        } catch (e) {
          console.error(`Error obteniendo animal ${app.animalId}:`, e);
          app.animalId = { _id: app.animalId, name: `Animal (ID: ${app.animalId.toString().substring(0, 8)}...)` };
        }
      }
      return app;
    }));
    
    // Log para verificar populate
    debugLog("📋 [MINE] Detalle de solicitudes del adoptante:");
    list.forEach((app: any, idx: number) => {
      const animalInfo = app.animalId 
        ? (typeof app.animalId === 'object' ? `${app.animalId._id} (nombre: ${app.animalId.name})` : app.animalId)
        : 'null';
      debugLog(`  ${idx + 1}. Solicitud ID: ${app._id}`);
      debugLog(`     - animalId: ${animalInfo}`);
      debugLog(`     - scorePct: ${app.scorePct || 0}%`);
    });

    debugLog("✅ Solicitudes del adoptante encontradas:", list.length);

    res.json({ applications: list, total: list.length });
  } catch (e) { 
    console.error("❌ Error en GET /applications/mine:", e);
    next(e); 
  }
});


// GET /api/v1/applications?status=... (FUNDACION/ADMIN)
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u: any = (req as any).user || {};
    const q: any = {};
    let foundationIdObj: any = null;
    
    if (u.role === "FUNDACION") {
      const foundationId = u.id || u._id || u.sub;
      // Convertir a ObjectId si es string
      foundationIdObj = mongoose.Types.ObjectId.isValid(foundationId) 
        ? new mongoose.Types.ObjectId(foundationId) 
        : foundationId;
      q.foundationId = foundationIdObj;
      
      debugLog("🔍 Buscando solicitudes para fundación ID:", foundationId);
      
      // DEBUG: Verificar todas las solicitudes sin filtrar para diagnosticar
      const allApps = await Application.find({}).select("_id foundationId animalId adopterId scorePct").lean();
      debugLog("🔍 [DEBUG] Total de solicitudes en BD:", allApps.length);
      
      // Mostrar TODOS los foundationId únicos que hay en las solicitudes
      const uniqueFoundationIds = [...new Set(allApps.map((app: any) => app.foundationId?.toString()).filter(Boolean))];
      debugLog("🔍 [DEBUG] FoundationIds únicos en las solicitudes:", uniqueFoundationIds.length);
      uniqueFoundationIds.forEach((fid: string, idx: number) => {
        const count = allApps.filter((app: any) => app.foundationId?.toString() === fid).length;
        debugLog(`  ${idx + 1}. FoundationId: ${fid} (${count} solicitudes)`);
      });
      debugLog("🔍 [DEBUG] FoundationId de la fundación logueada:", foundationId.toString());
      
      // MIGRACIÓN: Alinear foundationId de solicitudes con el del animal (o la fundación actual)
      let appsDataset = allApps;
      if (allApps.length > 0) {
        const foundationIdStr = foundationIdObj?.toString?.() ?? foundationId.toString();
        const animalIdSet = new Set<string>();
        allApps.forEach((app: any) => {
          if (app.animalId) animalIdSet.add(app.animalId.toString());
        });
        const animalIds = Array.from(animalIdSet).filter(Boolean);
        const animalQueryIds = animalIds
          .map((id) =>
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
          );
        const animalDocs = animalQueryIds.length
          ? await Animal.find({ _id: { $in: animalQueryIds } })
              .select("_id foundationId name")
              .lean()
          : [];
        const animalFoundationMap = new Map<string, string>();
        animalDocs.forEach((animal) => {
          if (animal?._id && animal.foundationId) {
            animalFoundationMap.set(
              animal._id.toString(),
              animal.foundationId.toString()
            );
          }
        });

        let fixedCount = 0;
        for (const app of allApps) {
          const currentId = app.foundationId ? app.foundationId.toString() : null;
          let desiredId =
            app.animalId && animalFoundationMap.has(app.animalId.toString())
              ? animalFoundationMap.get(app.animalId.toString()) || null
              : foundationIdStr;

          // Si no encontramos animal (se eliminó con el seed), asignar a la fundación actual
          if (!desiredId && foundationIdStr) {
            desiredId = foundationIdStr;
          }

          if (desiredId && currentId !== desiredId) {
            const newFoundationId = mongoose.Types.ObjectId.isValid(desiredId)
              ? new mongoose.Types.ObjectId(desiredId)
              : desiredId;
            debugLog(
              `🔧 Corrigiendo solicitud ${app._id}: foundationId ${currentId} -> ${desiredId}`
            );
            await Application.updateOne(
              { _id: app._id },
              { $set: { foundationId: newFoundationId } }
            );
            fixedCount++;
          }
        }

        if (fixedCount > 0) {
          debugLog(
            `✅ Se corrigieron ${fixedCount} solicitudes. Reconsultando datos...`
          );
          appsDataset = await Application.find({})
            .select("_id foundationId animalId adopterId scorePct")
            .lean();
        }
      }
      
      const appsForThisFoundation = appsDataset.filter((app: any) => {
        const appFoundationId = app.foundationId?.toString();
        const searchFoundationId = foundationId.toString();
        return appFoundationId === searchFoundationId;
      });
      debugLog("🔍 [DEBUG] Solicitudes para esta fundación (sin populate):", appsForThisFoundation.length);
      appsForThisFoundation.forEach((app: any, idx: number) => {
        debugLog(`  ${idx + 1}. Solicitud ID: ${app._id}`);
        debugLog(`     - animalId: ${app.animalId || 'null'}`);
        debugLog(`     - adopterId: ${app.adopterId || 'null'}`);
        debugLog(`     - scorePct: ${app.scorePct || 0}%`);
      });
    }
    if (req.query.status) q.status = String(req.query.status);

    debugLog("📋 Query de búsqueda:", JSON.stringify(q, null, 2));
    
    // Primero obtener las solicitudes sin populate para ver los IDs
    const rawList = await Application.find(q).select("_id animalId adopterId foundationId scorePct status createdAt rejectReason").lean();
    
    debugLog("📋 Solicitudes RAW (antes de populate):");
    rawList.forEach((app: any, idx: number) => {
      debugLog(`  ${idx + 1}. ID: ${app._id}, animalId: ${app.animalId}, adopterId: ${app.adopterId}`);
    });
    
    // Verificar que los animales y usuarios existan
    const animalIds = rawList.map((app: any) => app.animalId).filter(Boolean);
    const adopterIds = rawList.map((app: any) => app.adopterId).filter(Boolean);
    
    if (animalIds.length > 0) {
      // Convertir todos los IDs a ObjectId para la búsqueda
      const animalObjectIds = animalIds.map((id: any) => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return id;
      });
      
      const existingAnimals = await Animal.find({ _id: { $in: animalObjectIds } }).select("_id name foundationId").lean();
      debugLog("🐶 Animales encontrados en BD:", existingAnimals.length, "de", animalIds.length);
      existingAnimals.forEach((a: any) => {
        debugLog(`  - ${a._id}: ${a.name} (foundationId: ${a.foundationId})`);
      });
      
      const missingAnimals = animalIds.filter((id: any) => {
        const idStr = id.toString();
        return !existingAnimals.some((a: any) => a._id.toString() === idStr);
      });
      if (missingAnimals.length > 0) {
        debugLog("⚠️ Animales NO encontrados en BD:", missingAnimals.length);
        missingAnimals.forEach((id: any) => debugLog(`  - ${id}`));
      }
      
      // Verificar qué animales tiene esta fundación
      if (foundationIdObj) {
        const animalsForFoundation = await Animal.find({ foundationId: foundationIdObj }).select("_id name").lean();
        debugLog("🐶 Total de animales de esta fundación en BD:", animalsForFoundation.length);
        animalsForFoundation.forEach((a: any) => {
          debugLog(`  - ${a._id}: ${a.name}`);
        });
      }
    }
    
    if (adopterIds.length > 0) {
      const existingUsers = await User.find({ _id: { $in: adopterIds } }).select("_id email profile").lean();
      debugLog("👤 Usuarios encontrados en BD:", existingUsers.length, "de", adopterIds.length);
      existingUsers.forEach((u: any) => {
        debugLog(`  - ${u._id}: ${u.email} (${u.profile?.firstName || ''} ${u.profile?.lastName || ''})`);
      });
      const missingUsers = adopterIds.filter((id: any) => 
        !existingUsers.some((u: any) => u._id.toString() === id.toString())
      );
      if (missingUsers.length > 0) {
        debugLog("⚠️ Usuarios NO encontrados en BD:", missingUsers.length);
        missingUsers.forEach((id: any) => debugLog(`  - ${id}`));
      }
    }
    
    // Ahora hacer el populate
    let list = await Application
      .find(q)
      .populate({
        path: "animalId",
        select: "name photos attributes",
        options: { strictPopulate: false }
      })
      .populate({
        path: "adopterId",
        select: "email profile",
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();
    
    // Si el populate falló, hacer populate manual
    list = await Promise.all(list.map(async (app: any) => {
      // Si animalId no se populó, intentar obtenerlo manualmente
      const rawApp = rawList.find((r: any) => r._id.toString() === app._id.toString());
      
      if (!app.animalId || (typeof app.animalId === 'object' && !app.animalId.name) || (typeof app.animalId === 'string')) {
        if (rawApp && rawApp.animalId) {
          try {
            const animalIdObj = mongoose.Types.ObjectId.isValid(rawApp.animalId) 
              ? new mongoose.Types.ObjectId(rawApp.animalId) 
              : rawApp.animalId;
            const animal = await Animal.findById(animalIdObj).select("name photos attributes").lean();
            if (animal) {
              app.animalId = animal;
            } else {
              // Si no existe, crear un objeto con el ID para que al menos se muestre algo
              const idStr = rawApp.animalId.toString();
              app.animalId = { 
                _id: rawApp.animalId, 
                name: `Animal eliminado (ID: ${idStr.substring(0, 8)}...)`,
                photos: [],
                attributes: {}
              };
            }
          } catch (e) {
            console.error(`Error obteniendo animal ${rawApp.animalId}:`, e);
            const idStr = rawApp.animalId.toString();
            app.animalId = { 
              _id: rawApp.animalId, 
              name: `Animal eliminado (ID: ${idStr.substring(0, 8)}...)`,
              photos: [],
              attributes: {}
            };
          }
        } else if (!app.animalId) {
          app.animalId = { _id: null, name: "Animal no especificado", photos: [], attributes: {} };
        }
      }
      
      // Si adopterId no se populó, intentar obtenerlo manualmente
      if (!app.adopterId || (typeof app.adopterId === 'object' && !app.adopterId.email && !app.adopterId.profile) || (typeof app.adopterId === 'string')) {
        if (rawApp && rawApp.adopterId) {
          try {
            const adopterIdObj = mongoose.Types.ObjectId.isValid(rawApp.adopterId) 
              ? new mongoose.Types.ObjectId(rawApp.adopterId) 
              : rawApp.adopterId;
            const user = await User.findById(adopterIdObj).select("email profile").lean();
            if (user) {
              app.adopterId = user;
            } else {
              // Si no existe, crear un objeto con el ID
              const idStr = rawApp.adopterId.toString();
              app.adopterId = { 
                _id: rawApp.adopterId, 
                email: `Usuario eliminado (ID: ${idStr.substring(0, 8)}...)`,
                profile: {}
              };
            }
          } catch (e) {
            console.error(`Error obteniendo usuario ${rawApp.adopterId}:`, e);
            const idStr = rawApp.adopterId.toString();
            app.adopterId = { 
              _id: rawApp.adopterId, 
              email: `Usuario eliminado (ID: ${idStr.substring(0, 8)}...)`,
              profile: {}
            };
          }
        } else if (!app.adopterId) {
          app.adopterId = { _id: null, email: "Usuario no especificado", profile: {} };
        }
      }
      return app;
    }));
    
    // Log detallado de cada solicitud después del populate
    debugLog("📋 Detalle de todas las solicitudes encontradas (después de populate):");
    list.forEach((app: any, index: number) => {
      const animalIdStr = app.animalId 
        ? (typeof app.animalId === 'object' ? (app.animalId._id || app.animalId.id || 'objeto sin id') : app.animalId)
        : 'null';
      const adopterIdStr = app.adopterId 
        ? (typeof app.adopterId === 'object' ? (app.adopterId._id || app.adopterId.id || 'objeto sin id') : app.adopterId)
        : 'null';
      const animalName = app.animalId && typeof app.animalId === 'object' ? app.animalId.name : 'N/A';
      const adopterName = app.adopterId && typeof app.adopterId === 'object' 
        ? (app.adopterId.profile?.firstName + ' ' + app.adopterId.profile?.lastName || app.adopterId.email || 'N/A')
        : 'N/A';
      
      debugLog(`  ${index + 1}. Solicitud ID: ${app._id}`);
      debugLog(`     - foundationId: ${app.foundationId}`);
      debugLog(`     - animalId: ${animalIdStr} (nombre: ${animalName})`);
      debugLog(`     - adopterId: ${adopterIdStr} (nombre: ${adopterName})`);
      debugLog(`     - scorePct: ${app.scorePct || 0}%`);
      debugLog(`     - status: ${app.status || 'N/A'}`);
      
      // Verificar si el populate falló
      if (!app.animalId || (typeof app.animalId === 'object' && !app.animalId.name)) {
        debugLog(`     ⚠️ ADVERTENCIA: animalId no se populó correctamente`);
      }
      if (!app.adopterId || (typeof app.adopterId === 'object' && !app.adopterId.email && !app.adopterId.profile)) {
        debugLog(`     ⚠️ ADVERTENCIA: adopterId no se populó correctamente`);
      }
    });

    debugLog("✅ Solicitudes encontradas:", list.length);
    if (list.length > 0) {
      debugLog("📝 Primera solicitud:", {
        _id: list[0]._id,
        foundationId: list[0].foundationId,
        adopterId: list[0].adopterId,
        animalId: list[0].animalId,
        scorePct: list[0].scorePct,
      });
      // Mostrar todos los animalIds únicos
      const uniqueAnimalIds = [...new Set(list.map((app: any) => 
        typeof app.animalId === 'object' ? app.animalId?._id || app.animalId?.id : app.animalId
      ))];
      debugLog("🐶 Animales únicos en las solicitudes:", uniqueAnimalIds.length, uniqueAnimalIds);
    }

    res.json({ applications: list, total: list.length });
  } catch (e) { 
    console.error("❌ Error en GET /applications:", e);
    next(e); 
  }
});

// PATCH /api/v1/applications/:id (FUNDACION/ADMIN)
router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body || {};
    
    // Obtener estado anterior
    const oldApp = await Application.findById(req.params.id).lean();
    if (!oldApp) return res.status(404).json({ error: "Solicitud no encontrada" });
    
    const oldStatus = oldApp.status;
    
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status, "form.notes": notes } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });

    // Obtener modelos
    const { Notification } = require("../models/Notification");
    const { User } = require("../models/User");
    const { Animal } = require("../models/Animal");

    // Obtener datos de animal y adoptante
    const adopter = await User.findById(updated.adopterId).lean();
    const animal = await Animal.findById(updated.animalId).lean();

    // Si la solicitud fue aprobada, actualizar el estado del animal a 'ADOPTED'
    if (status === "APPROVED") {
      await Animal.findByIdAndUpdate(updated.animalId, { $set: { state: "ADOPTED" } });
      // Notificación de adopción exitosa para fundación
      try {
        await Notification.create({
          foundationId: updated.foundationId,
          type: "adoption",
          title: "Adopción exitosa",
          message: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} ha adoptado a ${animal?.name || ""}`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de adopción para fundación:", err);
      }
      // Notificación de adopción exitosa para clínica
      try {
        await Notification.create({
          clinicId: null as any,
          type: "adoption",
          title: "Adopción exitosa",
          message: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} ha adoptado a ${animal?.name || ""}`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de adopción para clínica:", err);
      }
    }
    // Si la solicitud fue rechazada
    if (status === "REJECTED") {
      await Animal.findByIdAndUpdate(updated.animalId, { $set: { state: "AVAILABLE" } });
      // Notificación de rechazo para fundación
      try {
        await Notification.create({
          foundationId: updated.foundationId,
          type: "adoption",
          title: "Solicitud rechazada",
          message: `La solicitud de ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} para adoptar a ${animal?.name || ""} fue rechazada.`,
          timestamp: new Date(),
          isRead: false,
          priority: "high",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de rechazo para fundación:", err);
      }
      // Notificación de rechazo para clínica
      try {
        await Notification.create({
          clinicId: null as any,
          type: "adoption",
          title: "Solicitud rechazada",
          message: `La solicitud de ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} para adoptar a ${animal?.name || ""} fue rechazada.`,
          timestamp: new Date(),
          isRead: false,
          priority: "high",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de rechazo para clínica:", err);
      }
    }
    // Si la solicitud se pone en revisión
    if (status === "IN_REVIEW") {
      await Animal.findByIdAndUpdate(updated.animalId, { $set: { state: "AVAILABLE" } });
      // Notificación de revisión para fundación
      try {
        await Notification.create({
          foundationId: updated.foundationId,
          type: "adoption",
          title: "Solicitud en revisión",
          message: `La solicitud de ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} para adoptar a ${animal?.name || ""} está en revisión.`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de revisión para fundación:", err);
      }
      // Notificación de revisión para clínica
      try {
        await Notification.create({
          clinicId: null as any,
          type: "adoption",
          title: "Solicitud en revisión",
          message: `La solicitud de ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""} para adoptar a ${animal?.name || ""} está en revisión.`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación de revisión para clínica:", err);
      }
    }
    // Si la solicitud pasa por clínica (ejemplo: HOME_VISIT)
    if (status === "HOME_VISIT") {
      // Notificación de visita domiciliaria/clínica para fundación
      try {
        await Notification.create({
          foundationId: updated.foundationId,
          type: "clinical",
          title: "Visita domiciliaria programada",
          message: `Se ha programado una visita domiciliaria para ${animal?.name || ""} (solicitante: ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}).`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación clínica para fundación:", err);
      }
      // Notificación de visita domiciliaria/clínica para clínica
      try {
        await Notification.create({
          clinicId: null as any,
          type: "clinical",
          title: "Visita domiciliaria programada",
          message: `Se ha programado una visita domiciliaria para ${animal?.name || ""} (solicitante: ${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}).`,
          timestamp: new Date(),
          isRead: false,
          priority: "medium",
          metadata: {
            animalName: animal?.name || "",
            userName: `${adopter?.profile?.firstName || ""} ${adopter?.profile?.lastName || ""}`
          }
        });
      } catch (err) {
        console.error("Error creando notificación clínica para clínica:", err);
      }
    }
    // Si la solicitud fue rechazada o puesta en revisión, actualizar el estado del animal a 'AVAILABLE'
    if (status === "REJECTED" || status === "IN_REVIEW") {
      await Animal.findByIdAndUpdate(updated.animalId, { $set: { state: "AVAILABLE" } });
    }

    // Enviar notificaciones solo si el estado cambió
    if (status && oldStatus !== status) {
      (async () => {
        try {
          const [adopter, animal, foundation] = await Promise.all([
            User.findById(updated.adopterId).lean(),
            Animal.findById(updated.animalId).lean(),
            User.findById(updated.foundationId).lean(),
          ]);

          if (adopter && animal) {
            const animalName = (animal as any).name || "Animal";
            const adopterName = `${adopter.profile.firstName} ${adopter.profile.lastName}`;
            const applicationId = String(updated._id);

            // Email específico según el nuevo estado
            if (status === "APPROVED") {
              await emailService.sendApplicationApprovedEmail({
                to: adopter.email,
                adopterName,
                animalName,
                applicationId,
                foundationContact: foundation?.email,
              });
            } else if (status === "REJECTED") {
              await emailService.sendApplicationRejectedEmail({
                to: adopter.email,
                adopterName,
                animalName,
                applicationId,
                reason: updated.rejectReason,
              });
            } else {
              // Otros cambios de estado (IN_REVIEW, HOME_VISIT, etc.)
              await emailService.sendApplicationStatusChangeEmail({
                to: adopter.email,
                adopterName,
                animalName,
                applicationId,
                oldStatus,
                newStatus: status,
              });
            }
          }
        } catch (err) {
          console.error("Error enviando notificación de cambio de estado:", err);
        }
      })().catch(err => console.error("Error en proceso de notificación:", err));
    }

    res.json(updated);
  } catch (e) { next(e); }
});

// PATCH /api/v1/applications/:id/reject (FUNDACION)
router.patch("/:id/reject", verifyJWT, requireRole("FUNDACION"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u: any = (req as any).user || {};
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ error: "El motivo de rechazo es requerido" });
    }

    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // Verificar que la solicitud pertenece a la fundación
    const foundationId = u.id || u._id || u.sub;
    const appFoundationId = app.foundationId?.toString();
    if (appFoundationId !== foundationId.toString()) {
      return res.status(403).json({ error: "No tienes permiso para rechazar esta solicitud" });
    }

    const oldStatus = app.status;
    app.status = "REJECTED";
    app.rejectReason = reason.trim();
    await app.save();

    // Enviar email de rechazo al adoptante
    (async () => {
      try {
        const [adopter, animal] = await Promise.all([
          User.findById(app.adopterId).lean(),
          Animal.findById(app.animalId).lean(),
        ]);
        
        if (adopter && animal) {
          await emailService.sendApplicationRejectedEmail({
            to: adopter.email,
            adopterName: `${adopter.profile.firstName} ${adopter.profile.lastName}`,
            animalName: (animal as any).name || "Animal",
            applicationId: String(app._id),
            reason: reason.trim(),
          });
        }
      } catch (err) {
        console.error("Error enviando email de rechazo:", err);
      }
    })().catch(err => console.error("Error en notificación de rechazo:", err));

    return res.json({ ok: true, message: "Solicitud rechazada correctamente" });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/applications/ranking (FUNDACION/ADMIN)
router.get("/ranking", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u: any = (req as any).user || {};
    const role = u.role;

    if (role !== "FUNDACION" && role !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { animalId, minScore } = req.query;
    const minScoreNum = minScore !== undefined ? Number(minScore) : null;

    const query: any = {};

    // Solo aplicar filtro de score si se especifica y es mayor a 0
    if (minScoreNum !== null && minScoreNum > 0) {
      query.scorePct = { $gte: minScoreNum };
    }

    if (animalId) {
      query.animalId = animalId;
    }

    // Si es FUNDACION, solo mostrar sus solicitudes
    if (role === "FUNDACION") {
      const foundationId = u.id || u._id || u.sub;
      const foundationIdObj = mongoose.Types.ObjectId.isValid(foundationId) 
        ? new mongoose.Types.ObjectId(foundationId) 
        : foundationId;
      const foundationIdStr = foundationIdObj?.toString?.() ?? foundationId.toString();

      // MIGRACIÓN: Corregir foundationId de solicitudes antes de buscar
      const allApps = await Application.find({})
        .select("_id foundationId animalId")
        .lean();

      const animalIdSet = new Set<string>();
      allApps.forEach((app: any) => {
        if (app.animalId) animalIdSet.add(app.animalId.toString());
      });
      const animalIds = Array.from(animalIdSet);
      const animalQueryIds = animalIds.map((id) =>
        mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
      );
      const animalDocs = animalQueryIds.length
        ? await Animal.find({ _id: { $in: animalQueryIds } })
            .select("_id foundationId")
            .lean()
        : [];
      const animalFoundationMap = new Map<string, string>();
      animalDocs.forEach((a) => {
        if (a?._id && a.foundationId) {
          animalFoundationMap.set(a._id.toString(), a.foundationId.toString());
        }
      });

      let fixedCount = 0;
      for (const app of allApps) {
        const currentId = app.foundationId ? app.foundationId.toString() : null;
        let desiredId =
          app.animalId && animalFoundationMap.has(app.animalId.toString())
            ? animalFoundationMap.get(app.animalId.toString()) || null
            : foundationIdStr;

        if (!desiredId && foundationIdStr) {
          desiredId = foundationIdStr;
        }

        if (desiredId && currentId !== desiredId) {
          const newFoundationId = mongoose.Types.ObjectId.isValid(desiredId)
            ? new mongoose.Types.ObjectId(desiredId)
            : desiredId;
          debugLog(
            `🔧 [RANKING] Corrigiendo solicitud ${app._id}: foundationId ${currentId} -> ${desiredId}`
          );
          await Application.updateOne(
            { _id: app._id },
            { $set: { foundationId: newFoundationId } }
          );
          fixedCount++;
        }
      }

      if (fixedCount > 0) {
        debugLog(`✅ [RANKING] Se corrigieron ${fixedCount} solicitudes.`);
      }
      
      query.foundationId = foundationIdObj;
      debugLog("🔍 [RANKING] Buscando solicitudes para fundación ID:", foundationId, "(tipo:", typeof query.foundationId, ")");
    }

    debugLog("📋 [RANKING] Query de búsqueda:", JSON.stringify(query, null, 2));

    const apps = await Application.find(query)
      .populate({
        path: "adopterId",
        select: "email profile",
        options: { strictPopulate: false }
      })
      .populate({
        path: "animalId",
        select: "name photos attributes",
        options: { strictPopulate: false }
      })
      .sort({ scorePct: -1, createdAt: -1 }) // Ordenar por score descendente, luego por fecha
      .lean();
    
    // Log detallado de cada solicitud en ranking
    debugLog("📋 [RANKING] Detalle de todas las solicitudes:");
    apps.forEach((app: any, index: number) => {
      debugLog(`  ${index + 1}. ID: ${app._id}`);
      debugLog(`     - foundationId: ${app.foundationId}`);
      debugLog(`     - animalId: ${app.animalId ? (typeof app.animalId === 'object' ? app.animalId._id || app.animalId.id : app.animalId) : 'null'}`);
      debugLog(`     - adopterId: ${app.adopterId ? (typeof app.adopterId === 'object' ? app.adopterId._id || app.adopterId.id : app.adopterId) : 'null'}`);
      debugLog(`     - scorePct: ${app.scorePct}`);
      if (app.animalId && typeof app.animalId === 'object') {
        debugLog(`     - Nombre del animal: ${app.animalId.name || 'N/A'}`);
      }
    });

    debugLog("✅ [RANKING] Solicitudes encontradas:", apps.length);
    if (apps.length > 0) {
      debugLog("📝 [RANKING] Primera solicitud:", {
        _id: apps[0]._id,
        foundationId: apps[0].foundationId,
        animalId: apps[0].animalId,
        scorePct: apps[0].scorePct,
      });
      // Mostrar todos los animalIds únicos
      const uniqueAnimalIds = [...new Set(apps.map((app: any) => 
        typeof app.animalId === 'object' ? app.animalId?._id || app.animalId?.id : app.animalId
      ))];
      debugLog("🐶 [RANKING] Animales únicos en las solicitudes:", uniqueAnimalIds.length, uniqueAnimalIds);
    }

    res.json({ applications: apps, total: apps.length });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/applications/:id (FUNDACION/ADMIN)
router.get("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u: any = (req as any).user || {};
    const role = u.role;
    const { id } = req.params;

    const app = await Application.findById(id)
      .populate({
        path: "animalId",
        select: "name photos attributes",
        options: { strictPopulate: false }
      })
      .populate({
        path: "adopterId",
        select: "email profile",
        options: { strictPopulate: false }
      })
      .lean();

    if (!app) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // Si es FUNDACION, verificar que la solicitud pertenece a su fundación
    if (role === "FUNDACION") {
      const foundationId = u.id || u._id || u.sub;
      const appFoundationId = app.foundationId?.toString();
      if (appFoundationId !== foundationId.toString()) {
        return res.status(403).json({ error: "No tienes permiso para ver esta solicitud" });
      }
    }

    res.json(app);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/applications/:id
 * Eliminar una solicitud de adopción (solo FUNDACION o ADMIN)
 */
router.delete("/:id", verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const u = (req as any).user;
    const role = u.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // Si es FUNDACION, verificar que la solicitud pertenece a su fundación
    if (role === "FUNDACION") {
      const foundationId = u.id || u._id || u.sub;
      const appFoundationId = app.foundationId?.toString();
      if (appFoundationId !== foundationId.toString()) {
        return res.status(403).json({ error: "No tienes permiso para eliminar esta solicitud" });
      }
    }

    // Solo ADMIN o FUNDACION pueden eliminar
    if (role !== "ADMIN" && role !== "FUNDACION") {
      return res.status(403).json({ error: "No autorizado para eliminar solicitudes" });
    }

    await Application.findByIdAndDelete(id);
    
    debugLog("🗑️ Solicitud eliminada:", { id, deletedBy: u.email });
    
    res.json({ message: "Solicitud eliminada exitosamente", id });
  } catch (e) {
    next(e);
  }
});

export default router;
