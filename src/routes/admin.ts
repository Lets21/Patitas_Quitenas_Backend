import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";

const router = Router();


router.get(
  "/overview",
  verifyJWT,
  requireRole("ADMIN"),
  async (req, res) => {
    
    return res.json({ ok: true, scope: "admin", user: req.user });
  }
);

export default router;
