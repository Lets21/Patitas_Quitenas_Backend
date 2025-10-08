import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";

const router = Router();


router.get(
  "/records",
  verifyJWT,
  requireRole("CLINICA"),
  async (req, res) => {
    
    return res.json({ records: [], user: req.user });
  }
);

export default router;
