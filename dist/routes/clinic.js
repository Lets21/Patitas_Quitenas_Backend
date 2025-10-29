"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyJWT_1 = require("../middleware/verifyJWT");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// GET /api/v1/clinic/records
router.get("/records", verifyJWT_1.verifyJWT, (0, requireRole_1.requireRole)("CLINICA"), async (req, res) => {
    // TODO: trae de Mongo las fichas clínicas de la clínica del usuario
    return res.json({ records: [], user: req.user });
});
exports.default = router;
//# sourceMappingURL=clinic.js.map