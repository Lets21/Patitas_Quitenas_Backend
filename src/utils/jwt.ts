// src/utils/jwt.ts
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? "").trim();

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;
const RAW_TTL = process.env.TOKEN_TTL ?? "15m";
const ACCESS_TTL: ExpiresIn = /^\d+(\.\d+)?$/.test(RAW_TTL)
  ? Number(RAW_TTL)
  : (RAW_TTL as ExpiresIn);

export type JwtPayloadBase = {
  sub: string;           // user id
  email: string;
  role: "ADMIN" | "FUNDACION" | "CLINICA" | "ADOPTANTE";
  type?: "access";
};

// ✅ Export con el nombre que espera auth.ts
export function signJwt(payload: JwtPayloadBase, opts: SignOptions = {}): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET no está definido");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL, ...opts });
}

// (si quieres conservar también el nombre nuevo)
export const signAccessToken = (payload: JwtPayloadBase, opts: SignOptions = {}) =>
  signJwt(payload, opts);

export function verifyJwt<T = JwtPayloadBase>(token: string): T {
  if (!JWT_SECRET) throw new Error("JWT_SECRET no está definido");
  return jwt.verify(token, JWT_SECRET) as T;
}
