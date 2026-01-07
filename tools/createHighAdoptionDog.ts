/**
 * Script para crear o actualizar un perro con características de ALTA adopción
 * Basado en patrones del dataset PetFinder que resultan en predicción = 1
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");
const { User } = require("../src/models/User");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function createHighAdoptionDog() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar una fundación
    const foundation = await User.findOne({ role: "FUNDACION" });
    if (!foundation) {
      console.log("❌ No se encontró ninguna fundación");
      return;
    }

    // Buscar si ya existe "Max"
    let max = await Animal.findOne({ name: "Max" });

    const highAdoptionProfile = {
      name: "Max",
      ageMonths: 18, // 1.5 años - edad óptima (no muy cachorro ni muy viejo)
      
      // RAZAS POPULARES
      breed1Code: 232, // Golden Retriever (MUY popular)
      breed2Code: 0,   // Sin mezcla (raza pura tiene mejor adopción)
      
      attributes: {
        age: 1.5,
        size: "MEDIUM", // Tamaño medio (más demandado)
        breed: "Golden Retriever",
        gender: "FEMALE", // Hembras más demandadas
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
        
        // COLORES POPULARES
        color1: "Golden", // Dorado (MUY atractivo)
        color2: "Cream",  // Crema (combinación hermosa)
        color3: null,
        
        // TAMAÑO Y PELO
        maturitySize: "Medium", // Medium es ideal
        furLength: "Long",      // Pelo largo (Golden característico, muy atractivo)
        
        // SALUD ÓPTIMA
        vaccinated: "Yes",   // Todas las vacunas
        dewormed: "Yes",     // Desparasitado
        sterilized: "Yes",   // Esterilizado (muy valorado)
        health: "Healthy",   // Completamente sano
        
        fee: 0, // GRATIS (muy importante)
      },
      
      clinicalSummary: "Perro sano, juguetón y sociable. Ideal para familias.",
      state: "AVAILABLE",
      foundationId: foundation._id,
      
      // Simular múltiples fotos (en realidad necesitarías URLs reales)
      photos: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
        "https://example.com/photo4.jpg",
      ],
    };

    if (max) {
      // Actualizar Max existente
      Object.assign(max, highAdoptionProfile);
      await max.save();
      console.log("✅ PERRO 'MAX' ACTUALIZADO CON PERFIL DE ALTA ADOPCIÓN");
    } else {
      // Crear nuevo Max
      max = await Animal.create(highAdoptionProfile);
      console.log("✅ NUEVO PERRO 'MAX' CREADO CON PERFIL DE ALTA ADOPCIÓN");
    }

    console.log("\n📊 CARACTERÍSTICAS DE MAX (Perfil de ALTA adopción)");
    console.log("====================================================");
    console.log("Nombre:", max.name);
    console.log("Edad:", max.ageMonths, "meses (1.5 años)");
    console.log("\n🐕 Razas:");
    console.log("  Breed1Code:", max.breed1Code, "→ Golden Retriever (raza MUY popular)");
    console.log("  Breed2Code:", max.breed2Code, "→ Sin mezcla (raza pura)");
    
    console.log("\n🎨 Características Físicas:");
    console.log("  Género:", max.attributes.gender, "→ FEMALE (más demandadas)");
    console.log("  Color1:", max.attributes.color1, "→ Golden (MUY atractivo)");
    console.log("  Color2:", max.attributes.color2, "→ Cream (hermoso)");
    console.log("  Tamaño:", max.attributes.maturitySize, "→ Medium (ideal)");
    console.log("  Pelo:", max.attributes.furLength, "→ Long (Golden característico)");
    
    console.log("\n🏥 Estado de Salud:");
    console.log("  Vacunado:", max.attributes.vaccinated, "✅");
    console.log("  Desparasitado:", max.attributes.dewormed, "✅");
    console.log("  Esterilizado:", max.attributes.sterilized, "✅");
    console.log("  Salud:", max.attributes.health, "✅");
    
    console.log("\n📸 Otros:");
    console.log("  Tarifa:", max.attributes.fee, "→ GRATIS");
    console.log("  Fotos:", max.photos.length, "→ Múltiples fotos (mejor presentación)");

    console.log("\n🎯 ¿POR QUÉ ESTE PERFIL TIENE ALTA PROBABILIDAD DE ADOPCIÓN?");
    console.log("=============================================================");
    console.log("1. ✅ Golden Retriever: Una de las razas MÁS populares y demandadas");
    console.log("2. ✅ Raza pura (no mezcla): Generalmente más valoradas");
    console.log("3. ✅ Color Golden/Cream: Colores muy atractivos y deseados");
    console.log("4. ✅ Hembra: Estadísticamente más demandadas que machos");
    console.log("5. ✅ Edad 18 meses: Ni muy cachorro ni muy viejo (óptimo)");
    console.log("6. ✅ Tamaño Medium: El más popular (no muy grande ni muy pequeño)");
    console.log("7. ✅ Pelo largo: Característica del Golden, muy hermoso");
    console.log("8. ✅ Salud perfecta: Todas las vacunas y cuidados al día");
    console.log("9. ✅ Esterilizado: Muy valorado por adoptantes responsables");
    console.log("10. ✅ Gratis (Fee=0): Sin barreras económicas");
    console.log("11. ✅ Múltiples fotos: Mejor presentación = más interés");

    console.log("\n🆚 COMPARACIÓN CON LANA (predicción=0):");
    console.log("========================================");
    console.log("Lana: Labrador+Beagle, Brown+White, 12 meses, Short fur, 1 foto");
    console.log("Max:  Golden puro, Golden+Cream, 18 meses, Long fur, 4 fotos");
    console.log("\nMax tiene características que el dataset identifica como MÁS adoptables");

    console.log("\n💡 RECOMENDACIÓN:");
    console.log("================");
    console.log("Ahora puedes hacer una solicitud de adopción para MAX y ver:");
    console.log("- Predicción ML probablemente será 1 (SÍ propenso a adoptar)");
    console.log("- Probabilidad será alta (60-100%)");
    console.log("- Score de compatibilidad también será alto");

    console.log("\n✅ Perro ID:", max._id);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createHighAdoptionDog();
