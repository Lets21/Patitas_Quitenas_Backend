import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtUser {
  id: string; // <- normalizado
  email: string;
  role: "ADOPTANTE" | "FUNDACION" | "CLINICA" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no configurado");

    const raw: any = jwt.verify(token, secret);

    // ⚠️ El token que generas tiene `sub` como id; normalizamos a `id`
    const id = raw?.sub || raw?._id || raw?.id;
    if (!id) return res.status(401).json({ error: "Token inválido" });

    req.user = {
      id: String(id),
      email: String(raw?.email || ""),
      role: raw?.role,
    };

    next();
  } catch (_err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
