import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface JwtUser {
  id: string;
  sub: string;
  email: string;
  role: "ADOPTANTE" | "FUNDACION" | "CLINICA" | "ADMIN";
}

// Extendemos Express.Request para tener req.user tipado
declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. leer header Authorization: "Bearer <token>"
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2. verificar token usando la MISMA secret que signJwt
    //    (esto internamente usa JWT_ACCESS_SECRET)
    const raw: any = verifyJwt(token);

    // 3. normalizar el usuario
    //    tu login firma como: { sub: user._id, email, role }
    const id = raw?.sub || raw?._id || raw?.id;
    if (!id) {
      return res.status(401).json({ error: "Token inválido" });
    }

    req.user = {
      id: String(id),
      sub: String(id),
      email: String(raw?.email || ""),
      role: raw?.role,
    };

    // 4. dejar pasar
    next();
  } catch (err) {
    console.error("verifyJWT error:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}