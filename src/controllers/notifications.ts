// src/controllers/notifications.ts
import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification";

// GET /api/v1/notifications (solo fundación)
export async function getFoundationNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const foundationId = req.user?.id;
    if (!foundationId) return res.status(401).json({ error: "No autorizado" });

    const notifications = await Notification.find({ foundationId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}
