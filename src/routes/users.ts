import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
  const user = await User.findById(req.user.sub).lean();
  res.json(user);
});

router.patch("/me", requireAuth, async (req: any, res) => {
  const { profile } = req.body || {};
  const user = await User.findByIdAndUpdate(req.user.sub, { profile }, { new: true }).lean();
  res.json(user);
});

export default router;
