// backend/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Middleware genérico de validación usando Zod
 * Valida el body, query params o params según el schema proporcionado
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validación fallida",
          details: error.issues.map((issue: z.ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validación de parámetros fallida",
          details: error.issues.map((issue: z.ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validación de ruta fallida",
          details: error.issues.map((issue: z.ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}
