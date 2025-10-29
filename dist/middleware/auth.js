"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const COOKIE_NAME = (process.env.COOKIE_NAME || "auth").trim();
function extractToken(req) {
    const raw = req.headers.authorization ||
        req.headers.Authorization;
    const bearer = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined;
    const fromCookie = req.cookies?.[COOKIE_NAME];
    return bearer || fromCookie || null;
}
function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token)
        return res.status(401).json({ error: "No token provided" });
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        if (payload.type && payload.type !== "access") {
            return res.status(401).json({ error: "Token inválido" });
        }
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "No token provided" });
        if (!roles.includes(user.role))
            return res.status(403).json({ error: "Forbidden" });
        next();
    };
}
//# sourceMappingURL=auth.js.map