import { Request, Response, NextFunction } from "express";
import { Animal } from "../models/Animal";
import mongoose from "mongoose";

/**
 * Obtener lista de animales de la fundación con filtros y paginación
 * GET /api/v1/foundation/animals
 */
export async function getFoundationAnimals(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("[getFoundationAnimals] Request received");
    console.log("[getFoundationAnimals] User:", req.user);
    
    // El ID puede ser string o ObjectId, Mongoose lo maneja automáticamente
    const foundationId = req.user!.id;
    
    // Parámetros de consulta
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const status = req.query.status as string || "todos";
    
    console.log("[getFoundationAnimals] Params:", { page, limit, search, status, foundationId });
    
    // Construir filtro
    const filter: any = { foundationId };
    
    // Filtro por búsqueda (nombre)
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    
    // Filtro por estado
    if (status !== "todos") {
      const statusMap: Record<string, string> = {
        "disponible": "AVAILABLE",
        "en-proceso": "RESERVED",
        "adoptado": "ADOPTED",
      };
      filter.state = statusMap[status] || status.toUpperCase();
    }
    
    // Calcular skip para paginación
    const skip = (page - 1) * limit;
    
    // Obtener animales
    const animals = await Animal.find(filter)
      .select("name attributes state clinicalSummary photos ageMonths personality compatibility clinicalHistory createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Contar total de documentos
    const total = await Animal.countDocuments(filter);
    
    // Formatear respuesta
    const formattedAnimals = animals.map(animal => {
      const ageMonths = (animal as any).ageMonths || 0;
      const ageYears = Math.floor(ageMonths / 12);
      const remainingMonths = ageMonths % 12;
      
      // Formatear edad para display
      let ageDisplay = "";
      if (ageMonths < 12) {
        // Menor a 1 año: mostrar solo meses
        ageDisplay = `${ageMonths} ${ageMonths === 1 ? 'mes' : 'meses'}`;
      } else if (remainingMonths === 0) {
        // Edad exacta en años: mostrar solo años
        ageDisplay = `${ageYears} ${ageYears === 1 ? 'año' : 'años'}`;
      } else {
        // Tiene años y meses: mostrar ambos
        ageDisplay = `${ageYears} ${ageYears === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
      }
      
      return {
        id: animal._id?.toString() || animal._id,
        _id: animal._id?.toString() || animal._id,
        name: animal.name,
        age: ageYears, // Edad en años (para compatibilidad)
        ageMonths: ageMonths, // Edad total en meses
        ageDisplay: ageDisplay, // Texto formateado para mostrar
        breed: animal.attributes?.breed || "Desconocido",
        size: animal.attributes?.size || "Desconocido",
        gender: animal.attributes?.gender || "Desconocido",
        energy: animal.attributes?.energy || "Desconocido",
        health: [animal.attributes?.health].filter(Boolean), // Array con el estado de salud
        status: animal.state,
        statusLabel: getStatusLabel(animal.state),
        statusColor: getStatusColor(animal.state),
        photo: animal.photos?.[0] || null,
        clinicalSummary: animal.clinicalSummary || "Sin información",
        attributes: animal.attributes, // Mantener para compatibilidad
        photos: animal.photos || [],
        personality: (animal as any).personality,
        compatibility: (animal as any).compatibility,
        clinicalHistory: (animal as any).clinicalHistory,
      };
    });

    console.log(`[getFoundationAnimals] Returning ${formattedAnimals.length} animals, total: ${total}`);
    
    return res.status(200).json({
      ok: true,
      data: {
        animals: formattedAnimals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener el label en español para el estado
 */
function getStatusLabel(state: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: "Disponible",
    RESERVED: "En proceso",
    ADOPTED: "Adoptado",
    RESCUED: "Rescatado",
    QUARANTINE: "En cuarentena",
  };
  return labels[state] || state;
}

/**
 * Obtener el color del badge según el estado
 */
function getStatusColor(state: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: "success",
    RESERVED: "warning",
    ADOPTED: "info",
    RESCUED: "secondary",
    QUARANTINE: "danger",
  };
  return colors[state] || "secondary";
}
