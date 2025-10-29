"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_TTL = exports.JWT_AUD = exports.JWT_ISS = exports.JWT_SECRET = exports.COOKIE_NAME = void 0;
// src/utils/authConfig.ts
exports.COOKIE_NAME = (process.env.COOKIE_NAME || "auth").trim();
// Prioridad: JWT_ACCESS_SECRET, luego JWT_SECRET
const RAW_SECRET = (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "").trim();
if (!RAW_SECRET) {
    throw new Error("Falta JWT_ACCESS_SECRET o JWT_SECRET en variables de entorno");
}
exports.JWT_SECRET = RAW_SECRET;
// Si NO los vas a usar, déjalos undefined y NO los pongas en verify/sign
exports.JWT_ISS = (process.env.JWT_ISS || "").trim() || undefined;
exports.JWT_AUD = (process.env.JWT_AUD || "").trim() || undefined;
// TTL coherente
exports.TOKEN_TTL = (process.env.TOKEN_TTL || "15m").trim();
//# sourceMappingURL=authConfig.js.map