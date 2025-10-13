"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...allowed) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role)
            return res.status(401).json({ error: "No autenticado" });
        if (!allowed.includes(role)) {
            return res.status(403).json({ error: "Acceso denegado" });
        }
        next();
    };
}
