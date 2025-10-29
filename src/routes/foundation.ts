import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";
import { getFoundationStats } from "../controllers/foundationStats";

const router = Router();

// GET /api/v1/foundation/animals
router.get(
  "/animals",
  verifyJWT,
  requireRole("FUNDACION"),
  async (req, res) => {
    // TODO: trae animales de la fundación
    return res.json({ animals: [], user: req.user });
  }
);

// GET /api/v1/foundation/stats
router.get(
  "/stats",
  verifyJWT,
  requireRole("FUNDACION"),
  getFoundationStats
);

export default router;
