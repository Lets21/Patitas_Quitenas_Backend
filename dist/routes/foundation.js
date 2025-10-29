"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyJWT_1 = require("../middleware/verifyJWT");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// GET /api/v1/foundation/animals
router.get("/animals", verifyJWT_1.verifyJWT, (0, requireRole_1.requireRole)("FUNDACION"), async (req, res) => {
    // TODO: trae animales de la fundación
    return res.json({ animals: [], user: req.user });
});
exports.default = router;
//# sourceMappingURL=foundation.js.map