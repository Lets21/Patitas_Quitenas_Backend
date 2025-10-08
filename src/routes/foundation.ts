import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT";
import { requireRole } from "../middleware/requireRole";

const router = Router();


router.get(
  "/animals",
  verifyJWT,
  requireRole("FUNDACION"),
  async (req, res) => {
    
    return res.json({ animals: [], user: req.user });
  }
);

export default router;
