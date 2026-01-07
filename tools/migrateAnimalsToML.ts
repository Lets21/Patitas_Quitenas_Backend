/**
 * Script de migración para agregar campos ML a animales existentes
 * 
 * Este script actualiza todos los animales en la BD agregando valores por defecto
 * para los campos necesarios para el modelo KNN clasificador.
 * 
 * Ejecutar con:
 * npx ts-node tools/migrateAnimalsToML.ts
 */

import mongoose from "mongoose";
import { Animal } from "../src/models/Animal";
import * as dotenv from "dotenv";

dotenv.config();

// Mapeos de ejemplo basados en valores comunes
// Estos se deben ajustar según las características reales de tus perros

const SIZE_TO_MATURITY = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
};

const GENDER_TO_CODE = {
  MALE: 1,
  FEMALE: 2,
};

// Razas más comunes (estos códigos son ejemplos, ajustar según dataset)
const BREED_MAPPING: Record<string, number> = {
  "mestizo": 307,
  "labrador": 265,
  "golden retriever": 232,
  "pastor alemán": 94,
  "chihuahua": 158,
  "bulldog": 125,
  "beagle": 76,
  "poodle": 265,
  "yorkshire": 307,
  "schnauzer": 294,
  "dalmata": 174,
  "husky": 250,
  "boxer": 103,
  "rottweiler": 287,
  "dachshund": 173,
  // Agregar más según necesites
};

// Colores comunes
const COLOR_MAPPING: Record<string, number> = {
  "negro": 1,
  "blanco": 2,
  "marrón": 3,
  "café": 3,
  "dorado": 4,
  "gris": 5,
  "crema": 6,
  "amarillo": 7,
};

async function migrateAnimals() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/petadopt";
    
    console.log("🔗 Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const animals = await Animal.find({});
    console.log(`\n📊 Encontrados ${animals.length} animales para migrar\n`);

    let updated = 0;
    let skipped = 0;

    for (const animal of animals) {
      const updates: any = {};

      // Breed code (buscar en mapping o usar default)
      if (animal.breed1Code === undefined || animal.breed1Code === 0) {
        const breedLower = animal.attributes.breed?.toLowerCase() || "";
        let breedCode = 0;
        
        for (const [key, code] of Object.entries(BREED_MAPPING)) {
          if (breedLower.includes(key)) {
            breedCode = code;
            break;
          }
        }
        
        updates.breed1Code = breedCode || 307; // 307 = Mixed Breed default
      }

      // Gender code
      if (animal.genderCode === undefined || animal.genderCode === 0) {
        updates.genderCode = GENDER_TO_CODE[animal.attributes.gender] || 1;
      }

      // Maturity size
      if (animal.maturitySizeCode === undefined || animal.maturitySizeCode === 0) {
        updates.maturitySizeCode = SIZE_TO_MATURITY[animal.attributes.size] || 2;
      }

      // Age in months (si no existe)
      if (!animal.ageMonths && animal.attributes.age) {
        updates.ageMonths = animal.attributes.age * 12;
      }

      // Photo count
      if (animal.photoCount === undefined || animal.photoCount === 0) {
        updates.photoCount = animal.photos?.length || 0;
      }

      // Valores por defecto para otros campos
      if (animal.breed2Code === undefined) updates.breed2Code = 0;
      if (animal.color1Code === undefined) updates.color1Code = 1; // Negro por defecto
      if (animal.color2Code === undefined) updates.color2Code = 0;
      if (animal.color3Code === undefined) updates.color3Code = 0;
      if (animal.furLengthCode === undefined) updates.furLengthCode = 1; // Short
      if (animal.vaccinatedCode === undefined) updates.vaccinatedCode = 3; // Not sure
      if (animal.dewormedCode === undefined) updates.dewormedCode = 3; // Not sure
      if (animal.sterilizedCode === undefined) {
        // Intentar obtener de clinicalHistory
        updates.sterilizedCode = animal.clinicalHistory?.sterilized ? 1 : 3;
      }
      if (animal.healthCode === undefined) updates.healthCode = 1; // Healthy
      if (animal.adoptionFee === undefined) updates.adoptionFee = 0;

      if (Object.keys(updates).length > 0) {
        await Animal.findByIdAndUpdate(animal._id, { $set: updates });
        updated++;
        console.log(`✅ Actualizado: ${animal.name} (${animal._id})`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📈 Migración completada:`);
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Sin cambios: ${skipped}`);
    console.log(`   📊 Total: ${animals.length}\n`);

  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

// Ejecutar
migrateAnimals().catch(console.error);
