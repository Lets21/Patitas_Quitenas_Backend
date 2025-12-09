/**
 * Script de migración: Actualizar animales con campo ageMonths
 * Convierte age (años) a ageMonths para el modelo KNN
 */

import mongoose from 'mongoose';
import { Animal } from '../src/models/Animal';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: No se encontró MONGODB_URI o MONGO_URI en .env');
  console.log('Por favor, verifica tu archivo .env en backend/');
  process.exit(1);
}

async function migrateAgeToMonths() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI!);
    console.log('✅ Conectado a MongoDB');

    console.log('\n📊 Obteniendo animales...');
    const animals = await Animal.find({});
    console.log(`Total de animales: ${animals.length}`);

    let updated = 0;
    let skipped = 0;

    for (const animal of animals) {
      // Si ya tiene ageMonths, saltar
      if ((animal as any).ageMonths !== undefined && (animal as any).ageMonths !== null) {
        skipped++;
        continue;
      }

      // Calcular ageMonths desde attributes.age
      const ageYears = animal.attributes?.age;
      if (ageYears !== undefined && ageYears !== null) {
        const ageMonths = ageYears * 12;
        
        await Animal.updateOne(
          { _id: animal._id },
          { $set: { ageMonths: ageMonths } }
        );

        console.log(`✓ ${animal.name}: ${ageYears} años → ${ageMonths} meses`);
        updated++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`   Actualizados: ${updated}`);
    console.log(`   Ya tenían ageMonths: ${skipped}`);
    console.log(`   Total: ${animals.length}`);

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateAgeToMonths();
