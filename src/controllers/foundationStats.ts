import { Request, Response, NextFunction } from "express";
import { Animal } from "../models/Animal";

// Estados considerados "todavía en la fundación / en proceso"
const WAITING_STATES = ["AVAILABLE", "RESERVED", "RESCUED", "QUARANTINE"];

export async function getFoundationStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const foundationId = req.user!.id;

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

    // Solicitudes activas de adopción (cuando tengan ese modelo lo conectamos)
    const activeRequests = 0;

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
