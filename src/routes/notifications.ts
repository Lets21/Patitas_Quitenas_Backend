// src/routes/notifications.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getFoundationNotifications } from "../controllers/notifications";

const router = Router();

// GET /api/v1/notifications
router.get("/", requireAuth, getFoundationNotifications);

export default router;
