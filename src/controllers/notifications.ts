// src/controllers/notifications.ts
import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification";

// GET /api/v1/notifications (FUNDACION y CLINICA)
export async function getFoundationNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    const userRole = (req.user as any)?.role;
    
    console.log("[getFoundationNotifications] User:", { userId, userRole, user: req.user });
    
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    let query: any = {};

    if (userRole === "FUNDACION") {
      // Fundaciones ven sus notificaciones por foundationId
      query.foundationId = userId;
    } else if (userRole === "CLINICA") {
      // Clínicas ven notificaciones de tipo "adoption" o "clinical" con clinicId null (globales)
      // o clinicId específico si se implementa en el futuro
      query.$or = [
        { clinicId: null },
        { clinicId: userId }
      ];
      query.type = { $in: ["adoption", "clinical"] };
    } else {
      return res.status(403).json({ error: "Rol no autorizado" });
    }

    console.log("[getFoundationNotifications] Query:", JSON.stringify(query, null, 2));

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    console.log("[getFoundationNotifications] Found notifications:", notifications.length);

    res.json({ notifications });
  } catch (err) {
    console.error("[getFoundationNotifications] Error:", err);
    next(err);
  }
}

// PATCH /api/v1/notifications/:id (marcar como leída)
export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    const userRole = (req.user as any)?.role;
    const notificationId = req.params.id;

    if (!userId) return res.status(401).json({ error: "No autorizado" });

    // Verificar que la notificación pertenece al usuario
    let query: any = { _id: notificationId };

    if (userRole === "FUNDACION") {
      query.foundationId = userId;
    } else if (userRole === "CLINICA") {
      query.$or = [
        { clinicId: null },
        { clinicId: userId }
      ];
      query.type = { $in: ["adoption", "clinical"] };
    } else {
      return res.status(403).json({ error: "Rol no autorizado" });
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("[markNotificationAsRead] Error:", err);
    next(err);
  }
}

// PATCH /api/v1/notifications/mark-all-read (marcar todas como leídas)
export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    const userRole = (req.user as any)?.role;

    if (!userId) return res.status(401).json({ error: "No autorizado" });

    let query: any = { isRead: false };

    if (userRole === "FUNDACION") {
      query.foundationId = userId;
    } else if (userRole === "CLINICA") {
      query.$or = [
        { clinicId: null },
        { clinicId: userId }
      ];
      query.type = { $in: ["adoption", "clinical"] };
    } else {
      return res.status(403).json({ error: "Rol no autorizado" });
    }

    const result = await Notification.updateMany(query, { $set: { isRead: true } });

    res.json({ 
      message: "Notificaciones marcadas como leídas",
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("[markAllNotificationsAsRead] Error:", err);
    next(err);
  }
}
