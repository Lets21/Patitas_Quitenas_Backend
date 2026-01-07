import {
  GENDER_CODES,
  COLOR_CODES,
  MATURITY_SIZE_CODES,
  FUR_LENGTH_CODES,
  YES_NO_CODES,
  HEALTH_CODES,
} from "./mlCodes";

// Define un tipo básico para tu animal (puedes ajustarlo según tu modelo de BD)
type Animal = any;

/**
 * Convierte valor legible a código numérico
 */
function toCode(mapping: Record<string, number>, value: string | undefined | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const upperValue = value.toUpperCase().replace(/ /g, "_");
  return mapping[upperValue] ?? defaultValue;
}

/**
 * Esta función transforma los datos de un perro de tu base de datos
 * al formato exacto que espera el microservicio de Python.
 * 
 * Ahora usa los campos LEGIBLES del modelo Animal y los convierte a códigos numéricos
 * 
 * Dataset columns: Type, Age, Breed1, Breed2, Gender, Color1, Color2, Color3,
 * MaturitySize, FurLength, Vaccinated, Dewormed, Sterilized, Health, Quantity, Fee, VideoAmt, PhotoAmt
 */
export function dogToMlPayload(dog: Animal): Record<string, any> {
    // Calcular edad en meses
    const ageInMonths = dog.ageMonths ?? (dog.attributes?.age ? dog.attributes.age * 12 : 0);
    
    // Extraer atributos
    const attrs = dog.attributes || {};
    
    return {
        Type: 1, // 1 para Perro (según el estándar de tu dataset)
        Age: ageInMonths,
        
        // Razas - usar códigos guardados en la BD
        Breed1: dog.breed1Code ?? 0,
        Breed2: dog.breed2Code ?? 0,
        
        // Género - convertir de MALE/FEMALE a código
        Gender: toCode(GENDER_CODES, attrs.gender, 1),
        
        // Colores - convertir de nombres a códigos
        Color1: toCode(COLOR_CODES, attrs.color1, 3), // Default Brown
        Color2: toCode(COLOR_CODES, attrs.color2, 0),
        Color3: toCode(COLOR_CODES, attrs.color3, 0),
        
        // Tamaño maduro - convertir de Small/Medium/Large a código
        MaturitySize: toCode(MATURITY_SIZE_CODES, attrs.maturitySize, 2), // Default Medium
        
        // Largo de pelo - convertir de Short/Medium/Long a código
        FurLength: toCode(FUR_LENGTH_CODES, attrs.furLength, 1), // Default Short
        
        // Estado de salud - convertir Yes/No/Not Sure a código
        Vaccinated: toCode(YES_NO_CODES, attrs.vaccinated, 3), // Default Not Sure
        Dewormed: toCode(YES_NO_CODES, attrs.dewormed, 3),
        Sterilized: toCode(YES_NO_CODES, attrs.sterilized, 3),
        
        // Salud - convertir Healthy/Minor Injury/Serious Injury a código
        Health: toCode(HEALTH_CODES, attrs.health, 1), // Default Healthy
        
        // Otros campos
        Quantity: 1, // Siempre 1 animal por registro
        Fee: attrs.fee ?? 0, // Tarifa de adopción
        VideoAmt: 0, // No tenemos videos (galería no soporta videos)
        PhotoAmt: Math.max(1, dog.photos?.length ?? 1) // Mínimo 1 foto (cada perro tiene foto)
    };
}