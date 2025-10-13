"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "No autorizado" });
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: "Token inválido" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "No autorizado" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "Prohibido" });
        next();
    };
}
