/**
 * Script para verificar las edades de los animales
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function checkAges() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    const animals = await Animal.find({}).select("name ageMonths attributes.age").lean();

    console.log("📋 EDADES DE ANIMALES:");
    console.log("=".repeat(60));
    console.log("Nombre".padEnd(20) + "| ageMonths | attributes.age");
    console.log("-".repeat(60));
    
    animals.forEach((a: any) => {
      const name = a.name || "Sin nombre";
      const ageMonths = a.ageMonths !== undefined ? a.ageMonths : "N/A";
      const ageYears = a.attributes?.age !== undefined ? a.attributes.age : "N/A";
      console.log(`${name.padEnd(20)}| ${String(ageMonths).padEnd(10)}| ${ageYears}`);
    });

    console.log("=".repeat(60));
    console.log(`Total: ${animals.length} animales`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

checkAges();
