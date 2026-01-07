/**
 * Script para actualizar Lana con razas específicas
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function updateLanaBreeds() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar a Lana
    const lana = await Animal.findOne({ name: "Lana" });

    if (!lana) {
      console.log("❌ No se encontró a Lana");
      return;
    }

    console.log("📋 DATOS ACTUALES DE LANA");
    console.log("========================");
    console.log("Nombre:", lana.name);
    console.log("Breed1Code actual:", lana.breed1Code);
    console.log("Breed2Code actual:", lana.breed2Code);

    // Actualizar con razas populares (ejemplo: Labrador + Beagle)
    lana.breed1Code = 265; // Labrador Retriever
    lana.breed2Code = 76;  // Beagle

    await lana.save();

    console.log("\n✅ RAZAS ACTUALIZADAS");
    console.log("====================");
    console.log("Breed1Code nuevo:", lana.breed1Code, "(Labrador Retriever)");
    console.log("Breed2Code nuevo:", lana.breed2Code, "(Beagle)");
    console.log("\nAhora Lana es: Mestizo de Labrador + Beagle");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateLanaBreeds();
