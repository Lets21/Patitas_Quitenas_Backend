import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import { getFoundationStats } from "../controllers/foundationStats";
import { getFoundationAnalytics } from "../controllers/foundationAnalytics";

const router = Router();

// Note: /animals routes are now handled by foundation.animals.ts router
// which is mounted separately in server.ts as /api/v1/foundation/animals

// GET /api/v1/foundation/stats
router.get(
  "/stats",
  verifyJWT,
  requireRole("FUNDACION"),
  getFoundationStats
);

// GET /api/v1/foundation/analytics
router.get(
  "/analytics",
  verifyJWT,
  requireRole("FUNDACION"),
  getFoundationAnalytics
);

export default router;
