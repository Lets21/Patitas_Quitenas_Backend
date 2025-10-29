"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = await User_1.User.findById(req.user.sub).lean();
    res.json(user);
});
router.patch("/me", auth_1.requireAuth, async (req, res) => {
    const { profile } = req.body || {};
    const user = await User_1.User.findByIdAndUpdate(req.user.sub, { profile }, { new: true }).lean();
    res.json(user);
});
exports.default = router;
//# sourceMappingURL=users.js.map