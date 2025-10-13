"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyJWT_1 = require("../middleware/verifyJWT");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// GET /api/v1/admin/overview
router.get("/overview", verifyJWT_1.verifyJWT, (0, requireRole_1.requireRole)("ADMIN"), async (req, res) => {
    // TODO: métricas globales
    return res.json({ ok: true, scope: "admin", user: req.user });
});
exports.default = router;
