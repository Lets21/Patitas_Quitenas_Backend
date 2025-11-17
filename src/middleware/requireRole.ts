import { Request, Response, NextFunction } from "express";

// Unión literal de roles permitidos (en un solo lugar)
export const ROLES = ["ADMIN", "FUNDACION", "CLINICA", "ADOPTANTE"] as const;
export type Role = typeof ROLES[number];

// Normaliza cualquier valor a Role | undefined
function toRole(v: any): Role | undefined {
  const s = String(v || "").toUpperCase();
  return (ROLES as readonly string[]).includes(s) ? (s as Role) : undefined;
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // en runtime, req.user viene del middleware de auth (JWT)
    const raw = req.user?.role;                    // puede ser string
    const role = toRole(raw);                      // -> Role | undefined

    if (!role) return res.status(401).json({ error: "No autenticado o rol inválido" });
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
}
