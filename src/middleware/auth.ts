import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

const COOKIE_NAME = (process.env.COOKIE_NAME || "auth").trim();

function extractToken(req: Request): string | null {
  const raw =
    (req.headers.authorization as string | undefined) ||
    ((req.headers as any).Authorization as string | undefined);
  const bearer = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined;
  const fromCookie = (req as any).cookies?.[COOKIE_NAME];
  return bearer || fromCookie || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = verifyJwt(token);
    if ((payload as any).type && (payload as any).type !== "access") {
      return res.status(401).json({ error: "Token inválido" });
    }
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "No token provided" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}