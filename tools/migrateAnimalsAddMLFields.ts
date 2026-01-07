/**
 * Script para migrar perros existentes agregando los campos ML faltantes
 * con valores por defecto inteligentes
 */

import mongoose from "mongoose";
import { Animal } from "../src/models/Animal";
import * as dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function migrateAnimalsAddMLFields() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const animals = await Animal.find({});
    console.log(`📊 Encontrados ${animals.length} perros para migrar`);

    let updated = 0;

    for (const animal of animals) {
      const updates: any = {};

      // Solo actualizar si el campo no existe o está vacío
      if (!animal.attributes.color1) {
        // Inferir color basado en la raza si es posible, sino Brown por defecto
        updates["attributes.color1"] = inferColorFromBreed(animal.attributes.breed);
      }

      if (!animal.attributes.maturitySize) {
        // Inferir tamaño maduro basado en size actual
        updates["attributes.maturitySize"] = inferMaturitySizeFromSize(animal.attributes.size);
      }

      if (!animal.attributes.furLength) {
        // Inferir largo de pelo basado en raza
        updates["attributes.furLength"] = inferFurLengthFromBreed(animal.attributes.breed);
      }

      if (!animal.attributes.vaccinated) {
        // Revisar historial clínico si existe
        if (animal.clinicalHistory?.lastVaccination) {
          updates["attributes.vaccinated"] = "Yes";
        } else {
          updates["attributes.vaccinated"] = "Not Sure";
        }
      }

      if (!animal.attributes.dewormed) {
        updates["attributes.dewormed"] = "Not Sure";
      }

      if (!animal.attributes.sterilized) {
        // Revisar historial clínico si existe
        if (animal.clinicalHistory?.sterilized) {
          updates["attributes.sterilized"] = "Yes";
        } else {
          updates["attributes.sterilized"] = "Not Sure";
        }
      }

      if (!animal.attributes.health) {
        // Inferir de condiciones clínicas
        if (animal.clinicalHistory?.conditions && animal.clinicalHistory.conditions.length > 0) {
          updates["attributes.health"] = "Minor Injury";
        } else {
          updates["attributes.health"] = "Healthy";
        }
      }

      if (animal.attributes.fee === undefined || animal.attributes.fee === null) {
        updates["attributes.fee"] = 0; // Adopción gratuita por defecto
      }

      // Aplicar updates si hay cambios
      if (Object.keys(updates).length > 0) {
        await Animal.updateOne({ _id: animal._id }, { $set: updates });
        updated++;
        console.log(`✅ Actualizado: ${animal.name} - ${Object.keys(updates).length} campos`);
      }
    }

    console.log(`\n🎉 Migración completada: ${updated}/${animals.length} perros actualizados`);
  } catch (error) {
    console.error("❌ Error en migración:", error);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Inferir color principal basado en la raza
 */
function inferColorFromBreed(breed: string): string {
  const breedLower = breed.toLowerCase();
  
  if (breedLower.includes("golden")) return "Golden";
  if (breedLower.includes("labrador")) {
    // Labradores pueden ser Yellow, Black, o Brown
    return "Yellow";
  }
  if (breedLower.includes("husky") || breedLower.includes("schnauzer")) return "Gray";
  if (breedLower.includes("rottweiler") || breedLower.includes("doberman")) return "Black";
  if (breedLower.includes("chihuahua") || breedLower.includes("yorkshire")) return "Brown";
  if (breedLower.includes("maltese") || breedLower.includes("bichon")) return "White";
  
  // Default: Brown (color más común)
  return "Brown";
}

/**
 * Inferir tamaño de madurez basado en tamaño actual
 */
function inferMaturitySizeFromSize(size: string): string {
  switch (size) {
    case "SMALL":
      return "Small";
    case "MEDIUM":
      return "Medium";
    case "LARGE":
      return "Large";
    default:
      return "Medium";
  }
}

/**
 * Inferir largo de pelo basado en raza
 */
function inferFurLengthFromBreed(breed: string): string {
  const breedLower = breed.toLowerCase();
  
  // Pelo largo
  if (
    breedLower.includes("afghan") ||
    breedLower.includes("yorkshire") ||
    breedLower.includes("shih tzu") ||
    breedLower.includes("maltese") ||
    breedLower.includes("cocker")
  ) {
    return "Long";
  }
  
  // Pelo mediano
  if (
    breedLower.includes("golden") ||
    breedLower.includes("husky") ||
    breedLower.includes("border") ||
    breedLower.includes("corgi")
  ) {
    return "Medium";
  }
  
  // Pelo corto (default)
  return "Short";
}

// Ejecutar migración
migrateAnimalsAddMLFields();
