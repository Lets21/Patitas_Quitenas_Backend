// src/routes/notifications.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { 
  getFoundationNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from "../controllers/notifications";

const router = Router();

// GET /api/v1/notifications
router.get("/", requireAuth, getFoundationNotifications);

// PATCH /api/v1/notifications/:id (marcar como leída)
router.patch("/:id", requireAuth, markNotificationAsRead);

// PATCH /api/v1/notifications/mark-all-read (marcar todas como leídas)
router.patch("/mark-all-read", requireAuth, markAllNotificationsAsRead);

export default router;
