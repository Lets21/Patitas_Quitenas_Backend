// backend/src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

/**
 * Rate limiting global: previene ataques de fuerza bruta
 * Límite de 100 requests por IP cada 15 minutos
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por IP
  message: "Demasiadas peticiones desde esta IP, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting específico para autenticación (más restrictivo)
 * 10 intentos de login/forgot-password cada 15 minutos (conservador para producción)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos para no ser muy restrictivo
  message: "Demasiados intentos de inicio de sesión, intenta en 15 minutos",
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
