/**
 * KNN Feature Mapping - Mapeo de datos a features del modelo
 * Convierte modelos de Animal y UserPreferences a vectores numéricos
 */

import { knnConfig } from './knnConfig';

/**
 * Features del modelo KNN (9 dimensiones):
 * 1. Age: Edad en meses
 * 2. MaturitySize: Tamaño (1=Small, 2=Medium, 3=Large, 4=Extra Large, 0=Not Specified)
 * 3. FurLength: Longitud del pelo (1=Short, 2=Medium, 3=Long, 0=Not Specified)
 * 4. Health: Estado de salud (1=Healthy, 2=Minor Injury, 3=Serious Injury, 0=Not Specified)
 * 5. Vaccinated: Vacunado (1=Yes, 2=No, 3=Not Sure)
 * 6. Dewormed: Desparasitado (1=Yes, 2=No, 3=Not Sure)
 * 7. Sterilized: Esterilizado (1=Yes, 2=No, 3=Not Sure)
 * 8. Fee: Costo de adopción (0-500)
 * 9. PhotoAmt: Cantidad de fotos (0-30)
 */

export interface Animal {
  attributes?: {
    age?: number; // edad en años
    size?: string; // SMALL, MEDIUM, LARGE
    breed?: string;
  };
  ageMonths?: number; // edad en meses si está disponible
  photos?: string[];
  clinicalHistory?: {
    sterilized?: boolean;
    lastVaccination?: string | null;
    conditions?: string | null;
  };
  personality?: {
    energy?: number; // 1-5
  };
}

export interface UserPreferences {
  preferredSize?: string; // SMALL, MEDIUM, LARGE
  preferredEnergy?: string; // LOW, MEDIUM, HIGH
  hasChildren?: boolean;
  experienceLevel?: string; // NONE, BEGINNER, INTERMEDIATE, EXPERT
  activityLevel?: string; // LOW, MEDIUM, HIGH
  timeAvailable?: string; // LOW, MEDIUM, HIGH
}

/**
 * Convierte tamaño de nuestro modelo a MaturitySize del dataset
 */
function sizeToMaturitySize(size?: string): number {
  if (!size) return 0; // Not Specified
  
  const sizeUpper = size.toUpperCase();
  switch (sizeUpper) {
    case 'SMALL':
      return 1;
    case 'MEDIUM':
      return 2;
    case 'LARGE':
      return 3;
    default:
      return 0; // Not Specified
  }
}

/**
 * Estima longitud de pelo basado en raza
 * TODO: Expandir esta lista con más razas
 */
function estimateFurLength(breed?: string): number {
  if (!breed) return 2; // Medium por defecto
  
  const breedLower = breed.toLowerCase();
  
  // Pelo corto
  if (
    breedLower.includes('beagle') ||
    breedLower.includes('boxer') ||
    breedLower.includes('pit bull') ||
    breedLower.includes('chihuahua') ||
    breedLower.includes('doberman') ||
    breedLower.includes('rottweiler')
  ) {
    return 1;
  }
  
  // Pelo largo
  if (
    breedLower.includes('golden') ||
    breedLower.includes('shih tzu') ||
    breedLower.includes('yorkshire') ||
    breedLower.includes('poodle') ||
    breedLower.includes('husky') ||
    breedLower.includes('collie') ||
    breedLower.includes('pastor') ||
    breedLower.includes('maltese')
  ) {
    return 3;
  }
  
  // Pelo medio (por defecto)
  return 2;
}

/**
 * Convierte un Animal a vector de features (9 dimensiones)
 */
export function buildAnimalFeatureVector(animal: Animal): number[] {
  // Feature 1: Age (en meses)
  let ageMonths = 0;
  if (animal.ageMonths !== undefined) {
    ageMonths = animal.ageMonths;
  } else if (animal.attributes?.age !== undefined) {
    ageMonths = animal.attributes.age * 12; // convertir años a meses
  }
  
  // Feature 2: MaturitySize
  const maturitySize = sizeToMaturitySize(animal.attributes?.size);
  
  // Feature 3: FurLength
  const furLength = estimateFurLength(animal.attributes?.breed);
  
  // Feature 4: Health (asumimos saludable por defecto)
  const health = animal.clinicalHistory?.conditions ? 2 : 1; // 1=Healthy, 2=Minor Injury
  
  // Feature 5: Vaccinated
  const vaccinated = animal.clinicalHistory?.lastVaccination ? 1 : 3; // 1=Yes, 3=Not Sure
  
  // Feature 6: Dewormed (asumimos que sí si tiene vacunas)
  const dewormed = animal.clinicalHistory?.lastVaccination ? 1 : 3;
  
  // Feature 7: Sterilized
  let sterilized = 3; // Not Sure por defecto
  if (animal.clinicalHistory?.sterilized === true) {
    sterilized = 1; // Yes
  } else if (animal.clinicalHistory?.sterilized === false) {
    sterilized = 2; // No
  }
  
  // Feature 8: Fee (asumimos $0 para adopciones)
  const fee = 0;
  
  // Feature 9: PhotoAmt
  const photoAmt = animal.photos?.length ?? 1;
  
  return [
    ageMonths,
    maturitySize,
    furLength,
    health,
    vaccinated,
    dewormed,
    sterilized,
    fee,
    photoAmt
  ];
}

/**
 * Convierte UserPreferences a vector de features (9 dimensiones)
 * Proyecta las preferencias del adoptante al mismo espacio de features
 */
export function buildAdopterFeatureVector(prefs: UserPreferences): number[] {
  // Feature 1: Age - Basado en experiencia y nivel de actividad
  // Principiantes prefieren adultos (24-60 meses), expertos pueden cachorros (6-12 meses)
  let preferredAgeMonths = 36; // Default: 3 años (adulto joven)
  
  if (prefs.experienceLevel === 'NONE' || prefs.experienceLevel === 'BEGINNER') {
    preferredAgeMonths = 48; // 4 años - más calmados
  } else if (prefs.experienceLevel === 'EXPERT') {
    preferredAgeMonths = 18; // 1.5 años - puede manejar jóvenes
  }
  
  // Ajustar por nivel de actividad
  if (prefs.activityLevel === 'HIGH') {
    preferredAgeMonths = Math.max(12, preferredAgeMonths - 12); // Preferir más jóvenes
  } else if (prefs.activityLevel === 'LOW') {
    preferredAgeMonths = Math.min(84, preferredAgeMonths + 24); // Preferir mayores
  }
  
  // Feature 2: MaturitySize
  const maturitySize = sizeToMaturitySize(prefs.preferredSize);
  
  // Feature 3: FurLength - Basado en tiempo disponible
  let furLength = 2; // Medium por defecto
  if (prefs.timeAvailable === 'LOW') {
    furLength = 1; // Short - menos mantenimiento
  } else if (prefs.timeAvailable === 'HIGH') {
    furLength = 2; // Medium - pueden manejar más grooming
  }
  
  // Feature 4: Health - Preferir saludables (1)
  const health = 1;
  
  // Feature 5: Vaccinated - Preferir vacunados (1)
  const vaccinated = 1;
  
  // Feature 6: Dewormed - Preferir desparasitados (1)
  const dewormed = 1;
  
  // Feature 7: Sterilized - Depende de experiencia
  // Principiantes prefieren esterilizados (menos problemas)
  let sterilized = 1; // Yes por defecto
  if (prefs.experienceLevel === 'EXPERT') {
    sterilized = 2; // Expertos pueden manejar no esterilizados
  }
  
  // Feature 8: Fee - Preferir bajo costo
  const fee = 0;
  
  // Feature 9: PhotoAmt - Preferir con buenas fotos (4-6 fotos)
  const photoAmt = 5;
  
  return [
    preferredAgeMonths,
    maturitySize,
    furLength,
    health,
    vaccinated,
    dewormed,
    sterilized,
    fee,
    photoAmt
  ];
}

/**
 * Obtiene nombres de features para debugging
 */
export function getFeatureNames(): string[] {
  return [...knnConfig.feature_names];
}

/**
 * Genera explicación legible de un vector de features
 */
export function explainFeatureVector(vector: number[]): Record<string, any> {
  const names = getFeatureNames();
  const explanation: Record<string, any> = {};
  
  vector.forEach((value, i) => {
    explanation[names[i]] = value;
  });
  
  return explanation;
}
