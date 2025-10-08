import { Request, Response, NextFunction } from "express";
import { JwtUser } from "./verifyJWT";

type Role = JwtUser["role"];

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "No autenticado" });
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
}
