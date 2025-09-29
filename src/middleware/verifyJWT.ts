import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtUser {
  _id: string;
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

    const payload = jwt.verify(token, secret) as JwtUser;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
