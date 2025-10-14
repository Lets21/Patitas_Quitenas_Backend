import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyJwt } from "../utils/jwt";

/** Roles que usas en la app */
export type Role = "ADMIN" | "ADOPTANTE" | "FUNDACION" | "CLINICA";

/** Payload mínimo que guardas en el token */
export interface JwtUser {
  id: string;
  role: Role;
  email?: string;
}

/** Usuario que colgamos en req.user (compatible con JwtUser)
 *  sub queda opcional para no romper si algún token lo trae.
 */
export interface AuthUser extends JwtUser {
  sub?: string;
}

/** Augment de Express: permite req.user en toda la app */
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

/** Middleware: exige token válido y cuelga req.user */
export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // verifyJwt debe devolver al menos { id, role, email? }
    const payload = verifyJwt<JwtUser>(token);

    // Normalizamos lo que guardamos en req.user
    req.user = { id: payload.id, role: payload.role, email: payload.email };

    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

/** Middleware: exige que el usuario tenga uno de los roles dados */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Prohibido" });
    }
    next();
  };
}
