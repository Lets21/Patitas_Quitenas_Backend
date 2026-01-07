/**
 * Script para corregir la edad de Lana de 108 meses a 12 meses
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function fixLanaAge() {
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
    console.log("Edad actual (ageMonths):", lana.ageMonths);
    console.log("Edad en attributes.age:", lana.attributes?.age);

    // Corregir edad
    lana.ageMonths = 12; // 1 año
    
    if (lana.attributes) {
      lana.attributes.age = 1; // 1 año para backward compatibility
    }

    await lana.save();

    console.log("\n✅ EDAD CORREGIDA");
    console.log("=================");
    console.log("Nueva edad (ageMonths):", lana.ageMonths);
    console.log("Nueva edad (attributes.age):", lana.attributes?.age);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixLanaAge();
