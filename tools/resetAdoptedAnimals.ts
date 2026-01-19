/**
 * Script para resetear el estado de los perros ADOPTADOS a DISPONIBLE
 * Útil después de hacer pruebas de adopción que no fueron reales
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function resetAdoptedAnimals() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar todos los animales adoptados
    const adoptedAnimals = await Animal.find({ state: "ADOPTED" });

    console.log("📋 PERROS CON ESTADO ADOPTADO");
    console.log("==============================");
    console.log(`Total encontrados: ${adoptedAnimals.length}\n`);

    if (adoptedAnimals.length === 0) {
      console.log("ℹ️ No hay perros con estado ADOPTED para resetear.");
      return;
    }

    // Mostrar lista de perros adoptados
    adoptedAnimals.forEach((animal: any, index: number) => {
      console.log(`${index + 1}. ${animal.name} (ID: ${animal._id})`);
    });

    console.log("\n🔄 Cambiando estado a AVAILABLE...\n");

    // Actualizar todos los perros adoptados a disponibles
    const result = await Animal.updateMany(
      { state: "ADOPTED" },
      { $set: { state: "AVAILABLE" } }
    );

    console.log("✅ CAMBIOS REALIZADOS");
    console.log("=====================");
    console.log(`Perros actualizados: ${result.modifiedCount}`);

    // Verificar el cambio
    const verifyAdopted = await Animal.countDocuments({ state: "ADOPTED" });
    const verifyAvailable = await Animal.countDocuments({ state: "AVAILABLE" });
    const verifyReserved = await Animal.countDocuments({ state: "RESERVED" });

    console.log("\n📊 ESTADÍSTICAS ACTUALES");
    console.log("========================");
    console.log(`🟢 Disponibles (AVAILABLE): ${verifyAvailable}`);
    console.log(`🟡 Reservados (RESERVED): ${verifyReserved}`);
    console.log(`🔴 Adoptados (ADOPTED): ${verifyAdopted}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

resetAdoptedAnimals();
