import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";

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

export default router;
