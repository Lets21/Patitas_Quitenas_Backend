// backend/src/utils/jwt.ts
import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

/** Firma un JWT (por defecto con el ACCESS_SECRET) */
export function signJwt<T extends object>(
  payload: T,
  options: SignOptions = {},
  useRefreshSecret = false
): string {
  const secret = useRefreshSecret ? REFRESH_SECRET : ACCESS_SECRET;
  if (!secret) throw new Error("JWT secret no configurado");
  // puedes setear expiresIn por defecto si quieres:
  const defaults: SignOptions = { expiresIn: options.expiresIn ?? "15m" };
  return jwt.sign(payload, secret, { ...defaults, ...options });
}

/** Verifica un JWT y devuelve el payload tipado */
export function verifyJwt<T extends object = JwtPayload>(
  token: string,
  options: VerifyOptions = {},
  useRefreshSecret = false
): T & JwtPayload {
  const secret = useRefreshSecret ? REFRESH_SECRET : ACCESS_SECRET;
  if (!secret) throw new Error("JWT secret no configurado");
  return jwt.verify(token, secret, options) as T & JwtPayload;
}

/** Helpers por si quieres usarlos explícitos */
export const signAccessToken = <T extends object>(p: T, o?: SignOptions) => signJwt<T>(p, o, false);
export const signRefreshToken = <T extends object>(p: T, o?: SignOptions) => signJwt<T>(p, o, true);
export const verifyAccessToken = <T extends object>(t: string, o?: VerifyOptions) => verifyJwt<T>(t, o, false);
export const verifyRefreshToken = <T extends object>(t: string, o?: VerifyOptions) => verifyJwt<T>(t, o, true);
