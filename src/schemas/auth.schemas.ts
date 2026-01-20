// backend/src/schemas/auth.schemas.ts
import { z } from "zod";

/**
 * Schemas de validación para endpoints de autenticación
 * Siguiendo mejores prácticas de seguridad y validación de datos
 */

// Schema para registro de usuario
export const registerSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  
  email: z.string()
    .email("Email inválido")
    .toLowerCase()
    .trim()
    .max(255, "El email no puede exceder 255 caracteres"),
  
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, "Número de teléfono inválido")
    .optional(),
  
  address: z.string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .optional(),
  
  profileImage: z.string().url("URL de imagen inválida").optional(),
});

// Schema para login
export const loginSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, "La contraseña es requerida")
    .max(128, "Contraseña inválida"),
});

// Schema para recuperación de contraseña
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
});

// Schema para reseteo de contraseña
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, "Token requerido"),
  
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
});

// Schema para actualización de perfil
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, "Número de teléfono inválido")
    .optional(),
  
  address: z.string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .optional(),
  
  profileImage: z.string().url("URL de imagen inválida").optional(),
}).strict(); // No permite campos adicionales
