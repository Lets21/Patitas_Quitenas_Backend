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
      .select("name attributes state clinicalSummary photos createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Contar total de documentos
    const total = await Animal.countDocuments(filter);
    
    // Formatear respuesta
    const formattedAnimals = animals.map(animal => ({
      id: animal._id?.toString() || animal._id,
      name: animal.name,
      age: animal.attributes?.age || 0,
      breed: animal.attributes?.breed || "Desconocida",
      size: animal.attributes?.size || "MEDIUM",
      gender: animal.attributes?.gender || "MALE",
      energy: animal.attributes?.energy || "MEDIUM",
      health: [
        // Determinar badges de salud basado en clinicalSummary o datos reales
        "Vacunado",
        ...(animal.state === "ADOPTED" ? ["Esterilizado"] : [])
      ],
      status: animal.state,
      statusLabel: getStatusLabel(animal.state),
      statusColor: getStatusColor(animal.state),
      photo: animal.photos?.[0] || null,
      clinicalSummary: animal.clinicalSummary || "Sin información",
    }));

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
