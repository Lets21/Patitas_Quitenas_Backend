"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = void 0;
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = (process.env.JWT_SECRET ?? "").trim();
const RAW_TTL = process.env.TOKEN_TTL ?? "15m";
const ACCESS_TTL = /^\d+(\.\d+)?$/.test(RAW_TTL)
    ? Number(RAW_TTL)
    : RAW_TTL;
// ✅ Export con el nombre que espera auth.ts
function signJwt(payload, opts = {}) {
    if (!JWT_SECRET)
        throw new Error("JWT_SECRET no está definido");
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL, ...opts });
}
// (si quieres conservar también el nombre nuevo)
const signAccessToken = (payload, opts = {}) => signJwt(payload, opts);
exports.signAccessToken = signAccessToken;
function verifyJwt(token) {
    if (!JWT_SECRET)
        throw new Error("JWT_SECRET no está definido");
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
//# sourceMappingURL=jwt.js.map