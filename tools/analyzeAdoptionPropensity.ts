/**
 * Script para analizar la propensión de adopción de todos los caninos
 * usando el modelo KNN Clasificador
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const { Animal } = require("../src/models/Animal");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

async function analyzeAllAnimals() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    const animals = await Animal.find({ state: { $in: ["AVAILABLE", "RESERVED"] } }).lean();
    console.log(`📊 Total de caninos a analizar: ${animals.length}\n`);
    console.log("=".repeat(80));

    const results = [];

    for (const animal of animals) {
      // Construir payload para el servicio ML
      const payload = {
        Type: 1, // Dog
        Age: animal.ageMonths || (animal.attributes?.age ? animal.attributes.age * 12 : 12),
        Breed1: animal.breed1Code || 0,
        Breed2: animal.breed2Code || 0,
        Gender: animal.genderCode || (animal.attributes?.gender === "MALE" ? 1 : 2),
        Color1: animal.color1Code || 0,
        Color2: animal.color2Code || 0,
        Color3: animal.color3Code || 0,
        MaturitySize: animal.maturitySizeCode || (
          animal.attributes?.size === "SMALL" ? 1 :
          animal.attributes?.size === "MEDIUM" ? 2 :
          animal.attributes?.size === "LARGE" ? 3 : 2
        ),
        FurLength: animal.furLengthCode || 2,
        Vaccinated: animal.vaccinatedCode || 3,
        Dewormed: animal.dewormedCode || 3,
        Sterilized: animal.sterilizedCode || 3,
        Health: animal.healthCode || 1,
        Quantity: 1, // Single animal
        Fee: animal.adoptionFee || 0,
        VideoAmt: 0,
        PhotoAmt: animal.photoCount || (animal.photos?.length || 1),
      };

      try {
        console.log(`\n🔍 Analizando: ${animal.name}...`);
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload);
        const prediction = response.data;

        console.log(`   ✅ Probabilidad: ${(prediction.probability * 100).toFixed(1)}% | Propensión: ${prediction.propensity}`);

        results.push({
          name: animal.name,
          id: animal._id.toString(),
          age: `${animal.ageMonths || animal.attributes?.age * 12} meses`,
          size: animal.attributes?.size,
          breed: animal.attributes?.breed,
          gender: animal.attributes?.gender,
          propensity: prediction.propensity,
          probability: prediction.probability,
          prediction: prediction.prediction,
          k_neighbors: prediction.k_neighbors,
          adopted_neighbors: prediction.adopted_neighbors,
          not_adopted_neighbors: prediction.not_adopted_neighbors,
        });

      } catch (error: any) {
        console.error(`❌ Error analizando ${animal.name}:`, error.response?.data || error.message);
        results.push({
          name: animal.name,
          id: animal._id.toString(),
          error: error.response?.data || error.message,
          propensity: -1,
          probability: 0,
        } as any);
      }
    }

    // Ordenar por probabilidad descendente
    results.sort((a, b) => (b.probability || 0) - (a.probability || 0));

    console.log("\n📈 RESULTADOS DEL ANÁLISIS KNN");
    console.log("=".repeat(80));

    // Caninos con ALTA propensión (Favorable)
    const favorable = results.filter(r => r.propensity === 1);
    console.log(`\n🟢 FAVORABLE (Alta propensión de adopción): ${favorable.length} caninos`);
    console.log("-".repeat(80));
    favorable.forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name} (ID: ${r.id})`);
      console.log(`   Edad: ${r.age} | Tamaño: ${r.size} | Raza: ${r.breed}`);
      console.log(`   Género: ${r.gender}`);
      console.log(`   Probabilidad: ${(r.probability * 100).toFixed(1)}%`);
      console.log(`   Vecinos KNN: ${r.adopted_neighbors}/${r.k_neighbors} adoptados`);
    });

    // Caninos con BAJA propensión (Atención Requerida)
    const atencion = results.filter(r => r.propensity === 0);
    console.log(`\n🔴 ATENCIÓN REQUERIDA (Baja propensión de adopción): ${atencion.length} caninos`);
    console.log("-".repeat(80));
    atencion.forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name} (ID: ${r.id})`);
      console.log(`   Edad: ${r.age} | Tamaño: ${r.size} | Raza: ${r.breed}`);
      console.log(`   Género: ${r.gender}`);
      console.log(`   Probabilidad: ${(r.probability * 100).toFixed(1)}%`);
      console.log(`   Vecinos KNN: ${r.adopted_neighbors}/${r.k_neighbors} adoptados`);
    });

    // Resumen estadístico
    console.log("\n📊 RESUMEN ESTADÍSTICO");
    console.log("=".repeat(80));
    console.log(`Total caninos analizados: ${results.length}`);
    console.log(`Favorable (propensity=1): ${favorable.length} (${((favorable.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`Atención Requerida (propensity=0): ${atencion.length} (${((atencion.length / results.length) * 100).toFixed(1)}%)`);
    
    const avgProb = results.reduce((sum, r) => sum + (r.probability || 0), 0) / results.length;
    console.log(`Probabilidad promedio: ${(avgProb * 100).toFixed(1)}%`);

    console.log("\n💡 RECOMENDACIONES PARA LA TESIS:");
    console.log("=".repeat(80));
    
    if (favorable.length > 0) {
      const bestCase = favorable[0];
      console.log(`\n✅ MEJOR CASO (Usar en tesis):`);
      console.log(`   ${bestCase.name} - ${(bestCase.probability * 100).toFixed(1)}% probabilidad`);
      console.log(`   ${bestCase.adopted_neighbors}/${bestCase.k_neighbors} vecinos fueron adoptados`);
      console.log(`   Edad: ${bestCase.age} | Tamaño: ${bestCase.size} | Raza: ${bestCase.breed}`);
    }
    
    if (atencion.length > 0) {
      const worstCase = atencion[atencion.length - 1];
      console.log(`\n⚠️  CASO DE ATENCIÓN (Usar en tesis):`);
      console.log(`   ${worstCase.name} - ${(worstCase.probability * 100).toFixed(1)}% probabilidad`);
      console.log(`   ${worstCase.adopted_neighbors}/${worstCase.k_neighbors} vecinos fueron adoptados`);
      console.log(`   Edad: ${worstCase.age} | Tamaño: ${worstCase.size} | Raza: ${worstCase.breed}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

analyzeAllAnimals();
