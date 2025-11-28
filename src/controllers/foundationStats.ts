import { Request, Response, NextFunction } from "express";
import { Animal } from "../models/Animal";
import { Application } from "../models/Application";

// Estados considerados "todavía en la fundación / en proceso"
const WAITING_STATES = ["AVAILABLE", "RESERVED", "RESCUED", "QUARANTINE"];

export async function getFoundationStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const foundationId = (req.user as any).id;

    // Total perros registrados por esta fundación
    const totalDogs = await Animal.countDocuments({ foundationId });

    // Perros que siguen en la fundación (no adoptados aún)
    const waitingDogs = await Animal.countDocuments({
      foundationId,
      state: { $in: WAITING_STATES },
    });

    // Perros adoptados
    const adoptedDogs = await Animal.countDocuments({
      foundationId,
      state: "ADOPTED",
    });

    // Solicitudes activas de adopción
    // Se consideran activas: RECIBIDA, IN_REVIEW, HOME_VISIT
    const activeRequests = await Application.countDocuments({
      foundationId,
      status: { $in: ["RECIBIDA", "IN_REVIEW", "HOME_VISIT"] },
    });

    return res.json({
      ok: true,
      data: {
        totalDogs,
        waitingDogs,
        adoptedDogs,
        activeRequests,
      },
    });
  } catch (err) {
    next(err);
  }
}
