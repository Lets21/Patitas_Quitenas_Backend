// src/utils/authConfig.ts
export const COOKIE_NAME = (process.env.COOKIE_NAME || "auth").trim();

// Prioridad: JWT_ACCESS_SECRET, luego JWT_SECRET
const RAW_SECRET = (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "").trim();
if (!RAW_SECRET) {
  throw new Error("Falta JWT_ACCESS_SECRET o JWT_SECRET en variables de entorno");
}
export const JWT_SECRET = RAW_SECRET;

// Si NO los vas a usar, déjalos undefined y NO los pongas en verify/sign
export const JWT_ISS = (process.env.JWT_ISS || "").trim() || undefined;
export const JWT_AUD = (process.env.JWT_AUD || "").trim() || undefined;

// TTL coherente
export const TOKEN_TTL = (process.env.TOKEN_TTL || "15m").trim();
