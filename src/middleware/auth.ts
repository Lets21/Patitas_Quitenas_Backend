import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthUser {
  sub: string;
  email: string;
  role: "ADMIN" | "ADOPTANTE" | "FUNDACION" | "CLINICA";
}

export function requireAuth(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = verifyJwt<AuthUser>(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request & { user?: AuthUser }, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Prohibido" });
    next();
  };
}
