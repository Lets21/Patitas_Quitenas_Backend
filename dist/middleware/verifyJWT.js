"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = verifyJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifyJWT(req, res, next) {
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: "No token provided" });
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET no configurado");
        const raw = jsonwebtoken_1.default.verify(token, secret);
        // ⚠️ El token que generas tiene `sub` como id; normalizamos a `id`
        const id = raw?.sub || raw?._id || raw?.id;
        if (!id)
            return res.status(401).json({ error: "Token inválido" });
        req.user = {
            id: String(id),
            email: String(raw?.email || ""),
            role: raw?.role,
        };
        next();
    }
    catch (_err) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}
