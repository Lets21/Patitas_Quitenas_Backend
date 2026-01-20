// backend/src/schemas/application.schemas.ts
import { z } from "zod";

/**
 * Schemas de validación para solicitudes de adopción
 * Asegura la integridad de los datos críticos del proceso de adopción
 */

export const createApplicationSchema = z.object({
  animalId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "ID de animal inválido"),
  
  userData: z.object({
    name: z.string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede exceder 100 caracteres")
      .trim(),
    
    email: z.string()
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    
    phone: z.string()
      .regex(/^\+?[0-9]{10,15}$/, "Número de teléfono inválido"),
    
    address: z.string()
      .min(10, "La dirección debe tener al menos 10 caracteres")
      .max(500, "La dirección no puede exceder 500 caracteres"),
    
    age: z.number()
      .int("La edad debe ser un número entero")
      .min(18, "Debes ser mayor de 18 años")
      .max(120, "Edad inválida"),
    
    occupation: z.string()
      .min(2, "La ocupación debe tener al menos 2 caracteres")
      .max(100, "La ocupación no puede exceder 100 caracteres")
      .optional(),
  }),
  
  livingConditions: z.object({
    housingType: z.enum(["casa", "apartamento", "finca", "otro"])
      .refine((val) => ["casa", "apartamento", "finca", "otro"].includes(val), {
        message: "Tipo de vivienda inválido"
      }),
    
    hasYard: z.boolean(),
    
    yardSize: z.string()
      .max(50, "Descripción de patio muy larga")
      .optional(),
    
    householdSize: z.number()
      .int("El tamaño del hogar debe ser un número entero")
      .min(1, "Debe haber al menos 1 persona")
      .max(50, "Tamaño de hogar inválido"),
    
    hasChildren: z.boolean(),
    
    childrenAges: z.array(z.number().int().min(0).max(18))
      .optional(),
  }),
  
  petExperience: z.object({
    hasOtherPets: z.boolean(),
    
    otherPetsDetails: z.string()
      .max(500, "Detalles muy largos")
      .optional(),
    
    previousPetExperience: z.string()
      .max(1000, "Experiencia muy larga")
      .optional(),
  }),
  
  adoptionMotivation: z.string()
    .min(20, "La motivación debe tener al menos 20 caracteres")
    .max(2000, "La motivación no puede exceder 2000 caracteres"),
  
  availability: z.object({
    timeForPet: z.string()
      .min(5, "Descripción de disponibilidad muy corta")
      .max(500, "Descripción muy larga"),
    
    canTravelWithPet: z.boolean(),
    
    hasVetAccess: z.boolean(),
  }).optional(),
  
  references: z.array(
    z.object({
      name: z.string().min(2).max(100),
      phone: z.string().regex(/^\+?[0-9]{10,15}$/),
      relationship: z.string().min(2).max(50),
    })
  )
    .min(0)
    .max(3, "Máximo 3 referencias")
    .optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "ADOPTADO"])
    .refine((val) => ["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "ADOPTADO"].includes(val), {
      message: "Estado inválido"
    }),
  
  notes: z.string()
    .max(2000, "Las notas no pueden exceder 2000 caracteres")
    .optional(),
});

export const applicationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de solicitud inválido"),
});
