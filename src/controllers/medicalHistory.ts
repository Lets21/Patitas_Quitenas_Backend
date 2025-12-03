// backend/src/controllers/medicalHistory.ts
import { Request, Response } from "express";
import { MedicalHistory } from "../models/MedicalHistory";
import { Animal } from "../models/Animal";
import mongoose from "mongoose";

/**
 * GET /api/v1/clinic/animals/:animalId/medical-history
 * Obtener historial médico de un animal (solo para clínica)
 */
export const getMedicalHistory = async (req: Request, res: Response) => {
  try {
    const { animalId } = req.params;

    if (!mongoose.isValidObjectId(animalId)) {
      return res.status(400).json({ error: "ID de animal inválido" });
    }

    // Optimizado: sin populate para respuesta más rápida, solo campos necesarios
    const history = await MedicalHistory.findOne({ animalId })
      .select("-__v")
      .lean();

    // Retornar null si no existe (no es error, simplemente no hay historial aún)
    return res.json({ ok: true, data: history || null });
  } catch (error: any) {
    console.error("[getMedicalHistory] Error:", error);
    return res.status(500).json({ error: error.message || "Error al obtener historial médico" });
  }
};

/**
 * POST /api/v1/clinic/animals/:animalId/medical-history
 * Crear o actualizar historial médico de un animal
 */
export const createOrUpdateMedicalHistory = async (req: Request, res: Response) => {
  try {
    const { animalId } = req.params;
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!mongoose.isValidObjectId(animalId)) {
      return res.status(400).json({ error: "ID de animal inválido" });
    }

    // Validar que el animal exista
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: "Animal no encontrado" });
    }

    const {
      lastVaccinationDate,
      sterilized,
      conditions,
      treatments,
      vaccines,
      surgeries,
      nextAppointment,
      notes,
    } = req.body;

    const historyData: any = {
      animalId,
      clinicUserId: userId,
    };

    // Procesar campos opcionales
    if (lastVaccinationDate !== undefined) {
      historyData.lastVaccinationDate = lastVaccinationDate ? new Date(lastVaccinationDate) : null;
    }
    if (sterilized !== undefined) {
      historyData.sterilized = sterilized;
    }
    if (conditions !== undefined) {
      historyData.conditions = conditions || null;
    }
    if (treatments !== undefined) {
      historyData.treatments = Array.isArray(treatments) ? treatments : [];
    }
    if (vaccines !== undefined) {
      historyData.vaccines = Array.isArray(vaccines) ? vaccines : [];
    }
    if (surgeries !== undefined) {
      historyData.surgeries = Array.isArray(surgeries) ? surgeries : [];
    }
    if (nextAppointment !== undefined) {
      historyData.nextAppointment = nextAppointment ? new Date(nextAppointment) : null;
    }
    if (notes !== undefined) {
      historyData.notes = notes || null;
    }

    const history = await MedicalHistory.findOneAndUpdate(
      { animalId },
      historyData,
      { new: true, upsert: true, runValidators: true }
    )
      .populate("clinicUserId", "email profile")
      .lean();

    return res.json({ ok: true, data: history });
  } catch (error: any) {
    console.error("[createOrUpdateMedicalHistory] Error:", error);
    return res.status(500).json({ error: error.message || "Error al guardar historial médico" });
  }
};

/**
 * GET /api/v1/clinic/animals
 * Obtener lista de todos los animales (para dashboard de clínica)
 */
export const getAllAnimals = async (req: Request, res: Response) => {
  try {
    const animals = await Animal.find({})
      .select("name photos foundationId attributes")
      .populate("foundationId", "profile.firstName profile.lastName email")
      .limit(1000)
      .lean();

    const mapped = animals.map((animal: any) => ({
      id: String(animal._id),
      _id: String(animal._id),
      name: animal.name,
      photos: animal.photos || [],
      foundation: animal.foundationId
        ? {
            id: String(animal.foundationId._id || animal.foundationId),
            name:
              animal.foundationId.profile?.firstName && animal.foundationId.profile?.lastName
                ? `${animal.foundationId.profile.firstName} ${animal.foundationId.profile.lastName}`
                : animal.foundationId.email || "Fundación",
          }
        : null,
      attributes: animal.attributes,
    }));

    return res.json({ ok: true, data: { animals: mapped } });
  } catch (error: any) {
    console.error("[getAllAnimals] Error:", error);
    return res.status(500).json({ error: error.message || "Error al obtener animales" });
  }
};

