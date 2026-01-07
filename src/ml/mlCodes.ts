/**
 * Constantes y helpers para mapear atributos de animales a códigos ML
 * Basado en el dataset PetFinder
 */

// ========== GENDER CODES ==========
export const GENDER_CODES = {
  MALE: 1,
  FEMALE: 2,
  MIXED: 3, // Grupo mixto
} as const;

// ========== MATURITY SIZE CODES ==========
export const MATURITY_SIZE_CODES = {
  SMALL: 1,      // 1-10 kg
  MEDIUM: 2,     // 10-25 kg
  LARGE: 3,      // 25-40 kg
  EXTRA_LARGE: 4 // 40+ kg
} as const;

// ========== FUR LENGTH CODES ==========
export const FUR_LENGTH_CODES = {
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
} as const;

// ========== VACCINATION/DEWORMED/STERILIZED CODES ==========
export const YES_NO_CODES = {
  YES: 1,
  NO: 2,
  NOT_SURE: 3,
} as const;

// ========== HEALTH CODES ==========
export const HEALTH_CODES = {
  HEALTHY: 1,
  MINOR_INJURY: 2,
  SERIOUS_INJURY: 3,
} as const;

// ========== COLOR CODES ==========
// Basado en colores más comunes en el dataset PetFinder
export const COLOR_CODES = {
  BLACK: 1,
  BROWN: 2,    // Corregido: Brown es código 2
  GOLDEN: 3,
  YELLOW: 4,
  CREAM: 5,
  GRAY: 6,
  WHITE: 7,    // Corregido: White es código 7
  // Agregar más según necesites
} as const;

// ========== BREED CODES ==========
// Top razas del dataset PetFinder
// Nota: 307 = Mixed Breed (mestizo) es el más común
export const COMMON_BREED_CODES = {
  // Razas más comunes
  MIXED_BREED: 307,
  LABRADOR_RETRIEVER: 265,
  GOLDEN_RETRIEVER: 232,
  GERMAN_SHEPHERD: 94,
  CHIHUAHUA: 158,
  BEAGLE: 76,
  BULLDOG: 125,
  POODLE: 265,
  YORKSHIRE_TERRIER: 307,
  DACHSHUND: 173,
  BOXER: 103,
  HUSKY: 250,
  ROTTWEILER: 287,
  SCHNAUZER: 294,
  DALMATIAN: 174,
  SHIH_TZU: 295,
  POMERANIAN: 273,
  PUG: 277,
  COCKER_SPANIEL: 162,
  MALTESE: 218,
} as const;

// ========== HELPER FUNCTIONS ==========

/**
 * Mapea el tamaño de string a código numérico
 */
export function sizeToCode(size: "SMALL" | "MEDIUM" | "LARGE"): number {
  const map = {
    SMALL: MATURITY_SIZE_CODES.SMALL,
    MEDIUM: MATURITY_SIZE_CODES.MEDIUM,
    LARGE: MATURITY_SIZE_CODES.LARGE,
  };
  return map[size] || MATURITY_SIZE_CODES.MEDIUM;
}

/**
 * Mapea el género de string a código numérico
 */
export function genderToCode(gender: "MALE" | "FEMALE"): number {
  return gender === "MALE" ? GENDER_CODES.MALE : GENDER_CODES.FEMALE;
}

/**
 * Busca el código de raza por nombre (aproximado)
 */
export function findBreedCode(breedName: string): number {
  const normalized = breedName.toLowerCase().trim();
  
  const breedMap: Record<string, number> = {
    "mestizo": COMMON_BREED_CODES.MIXED_BREED,
    "mixed": COMMON_BREED_CODES.MIXED_BREED,
    "criollo": COMMON_BREED_CODES.MIXED_BREED,
    "labrador": COMMON_BREED_CODES.LABRADOR_RETRIEVER,
    "golden": COMMON_BREED_CODES.GOLDEN_RETRIEVER,
    "pastor alemán": COMMON_BREED_CODES.GERMAN_SHEPHERD,
    "german shepherd": COMMON_BREED_CODES.GERMAN_SHEPHERD,
    "chihuahua": COMMON_BREED_CODES.CHIHUAHUA,
    "beagle": COMMON_BREED_CODES.BEAGLE,
    "bulldog": COMMON_BREED_CODES.BULLDOG,
    "poodle": COMMON_BREED_CODES.POODLE,
    "yorkshire": COMMON_BREED_CODES.YORKSHIRE_TERRIER,
    "dachshund": COMMON_BREED_CODES.DACHSHUND,
    "salchicha": COMMON_BREED_CODES.DACHSHUND,
    "boxer": COMMON_BREED_CODES.BOXER,
    "husky": COMMON_BREED_CODES.HUSKY,
    "rottweiler": COMMON_BREED_CODES.ROTTWEILER,
    "schnauzer": COMMON_BREED_CODES.SCHNAUZER,
    "dalmata": COMMON_BREED_CODES.DALMATIAN,
    "dalmatian": COMMON_BREED_CODES.DALMATIAN,
    "shih tzu": COMMON_BREED_CODES.SHIH_TZU,
    "pomeranian": COMMON_BREED_CODES.POMERANIAN,
    "pug": COMMON_BREED_CODES.PUG,
    "cocker": COMMON_BREED_CODES.COCKER_SPANIEL,
    "maltés": COMMON_BREED_CODES.MALTESE,
    "maltese": COMMON_BREED_CODES.MALTESE,
  };
  
  for (const [key, code] of Object.entries(breedMap)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  
  // Default: mestizo
  return COMMON_BREED_CODES.MIXED_BREED;
}

/**
 * Busca el código de color por nombre
 */
export function findColorCode(colorName: string): number {
  const normalized = colorName.toLowerCase().trim();
  
  const colorMap: Record<string, number> = {
    "negro": COLOR_CODES.BLACK,
    "black": COLOR_CODES.BLACK,
    "blanco": COLOR_CODES.WHITE,
    "white": COLOR_CODES.WHITE,
    "marrón": COLOR_CODES.BROWN,
    "brown": COLOR_CODES.BROWN,
    "café": COLOR_CODES.BROWN,
    "dorado": COLOR_CODES.GOLDEN,
    "golden": COLOR_CODES.GOLDEN,
    "gris": COLOR_CODES.GRAY,
    "gray": COLOR_CODES.GRAY,
    "crema": COLOR_CODES.CREAM,
    "cream": COLOR_CODES.CREAM,
    "amarillo": COLOR_CODES.YELLOW,
    "yellow": COLOR_CODES.YELLOW,
  };
  
  for (const [key, code] of Object.entries(colorMap)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  
  // Default: black
  return COLOR_CODES.BLACK;
}

/**
 * Convierte años a meses
 */
export function yearsToMonths(years: number): number {
  return Math.round(years * 12);
}

/**
 * Mapea un booleano a código Yes/No/NotSure
 */
export function booleanToYesNoCode(value: boolean | undefined): number {
  if (value === true) return YES_NO_CODES.YES;
  if (value === false) return YES_NO_CODES.NO;
  return YES_NO_CODES.NOT_SURE;
}
