import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// GET /api/v1/clinic/records
router.get(
  "/records",
  verifyJWT,
  requireRole("CLINICA"),
  async (req, res) => {
    // TODO: trae de Mongo las fichas clínicas de la clínica del usuario
    return res.json({ records: [], user: req.user });
  }
);

export default router;