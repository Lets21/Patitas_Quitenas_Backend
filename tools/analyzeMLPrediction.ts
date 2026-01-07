/**
 * Script para ver los datos de la última solicitud de adopción
 * y el payload ML que se envió
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

// Importar modelos después de dotenv
const { Application } = require("../src/models/Application");
const { Animal } = require("../src/models/Animal");
const { dogToMlPayload } = require("../src/ml/dogToMlPayload");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function analyzeLastApplication() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar la última solicitud
    const lastApp = await Application.findOne()
      .sort({ createdAt: -1 })
      .populate("animalId")
      .lean();

    if (!lastApp) {
      console.log("❌ No hay solicitudes en la base de datos");
      return;
    }

    console.log("📋 ÚLTIMA SOLICITUD DE ADOPCIÓN");
    console.log("================================");
    console.log("ID:", lastApp._id);
    console.log("Fecha:", new Date(lastApp.createdAt).toLocaleString());
    console.log("Adoptante ID:", lastApp.adopterId);
    console.log("\n🐕 INFORMACIÓN DEL PERRO");
    console.log("========================");
    
    const animal = lastApp.animalId as any;
    if (animal && animal.name) {
      console.log("Nombre:", animal.name);
      console.log("Edad (meses):", animal.ageMonths);
      console.log("Género:", animal.attributes?.gender);
      console.log("Tamaño:", animal.attributes?.size);
      
      console.log("\n📊 CAMPOS ML DEL PERRO");
      console.log("======================");
      console.log("Color1:", animal.attributes?.color1);
      console.log("Color2:", animal.attributes?.color2);
      console.log("Color3:", animal.attributes?.color3);
      console.log("Tamaño madurez:", animal.attributes?.maturitySize);
      console.log("Largo pelo:", animal.attributes?.furLength);
      console.log("Vacunado:", animal.attributes?.vaccinated);
      console.log("Desparasitado:", animal.attributes?.dewormed);
      console.log("Esterilizado:", animal.attributes?.sterilized);
      console.log("Salud:", animal.attributes?.health);
      console.log("Tarifa:", animal.attributes?.fee);
      console.log("Fotos:", animal.photos?.length || 0);

      console.log("\n🤖 PAYLOAD ENVIADO AL ML SERVICE (18 características)");
      console.log("=====================================================");
      const payload = dogToMlPayload(animal);
      console.log(JSON.stringify(payload, null, 2));

      console.log("\n✅ PREDICCIÓN ML RECIBIDA");
      console.log("=========================");
      console.log("Propensión (pred):", lastApp.propensityPred === 1 ? "1 (✅ SÍ propenso)" : "0 (❌ NO propenso)");
      console.log("Probabilidad:", lastApp.propensityProba ? `${(lastApp.propensityProba * 100).toFixed(1)}%` : "N/A");
      console.log("Versión modelo:", lastApp.mlVersion || "N/A");

      console.log("\n📈 SCORE DE COMPATIBILIDAD");
      console.log("==========================");
      console.log("Score:", `${lastApp.scorePct}%`);
      console.log("Elegible:", lastApp.eligible ? "✅ SÍ" : "❌ NO");

      // Explicación
      console.log("\n💡 EXPLICACIÓN DEL RESULTADO");
      console.log("============================");
      
      if (lastApp.propensityPred === 0) {
        console.log("❌ El modelo predijo 0 (NO propenso a adoptar)");
        console.log("\n🔍 Esto significa que:");
        console.log("- El modelo KNN buscó los 15 perros MÁS PARECIDOS a Lana en el dataset de 14,000+ perros");
        console.log("- Calculó similitud usando las 18 características (edad, colores, vacunas, etc.)");
        console.log(`- De esos 15 vecinos más cercanos, la MAYORÍA (${15 - Math.round((lastApp.propensityProba || 0) * 15)} de 15) NO fueron adoptados`);
        console.log(`- Solo ${Math.round((lastApp.propensityProba || 0) * 15)} de 15 fueron adoptados → Probabilidad: ${((lastApp.propensityProba || 0) * 100).toFixed(1)}%`);
        console.log("\n📊 Factores que pudieron influir:");
        console.log("- Edad:", animal.ageMonths, "meses");
        console.log("- Colores:", animal.attributes?.color1, animal.attributes?.color2 || "ninguno", animal.attributes?.color3 || "ninguno");
        console.log("- Largo pelo:", animal.attributes?.furLength);
        console.log("- Estado salud:", animal.attributes?.vaccinated, "/", animal.attributes?.dewormed, "/", animal.attributes?.sterilized);
      } else {
        console.log("✅ El modelo predijo 1 (SÍ propenso a adoptar)");
        console.log(`- De los 15 vecinos más cercanos, la MAYORÍA (${Math.round((lastApp.propensityProba || 0) * 15)} de 15) SÍ fueron adoptados`);
      }

    } else {
      console.log("❌ No se encontró información del animal");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeLastApplication();
