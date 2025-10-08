import jwt from "jsonwebtoken";
export function signJwt(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}
export function verifyJwt<T>(token: string): T {
  return jwt.verify(token, process.env.JWT_SECRET!) as T;
}
