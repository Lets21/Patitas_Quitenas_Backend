/**
 * Script para asignar Max a la fundación correcta (PAE - Leonardo Tamayo)
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const { Animal } = require("../src/models/Animal");
const { User } = require("../src/models/User");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/pae";

async function fixMaxFoundation() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar al usuario Leonardo Tamayo (fundación PAE)
    const leonardo = await User.findOne({ 
      email: "lets.crp@outlook.com",
      role: "FUNDACION"
    });

    if (!leonardo) {
      console.log("❌ No se encontró la fundación de Leonardo Tamayo");
      console.log("\n📋 Buscando todas las fundaciones...");
      const foundations = await User.find({ role: "FUNDACION" });
      console.log("Fundaciones encontradas:", foundations.length);
      foundations.forEach((f: any) => {
        console.log(`  - ${f.name} (${f.email}) - ID: ${f._id}`);
      });
      return;
    }

    console.log("✅ Fundación encontrada:");
    console.log("  Nombre:", leonardo.name);
    console.log("  Email:", leonardo.email);
    console.log("  ID:", leonardo._id);

    // Buscar a Max
    const max = await Animal.findOne({ name: "Max" });

    if (!max) {
      console.log("\n❌ No se encontró a Max");
      return;
    }

    console.log("\n📋 DATOS ACTUALES DE MAX:");
    console.log("  ID:", max._id);
    console.log("  Nombre:", max.name);
    console.log("  Fundación actual:", max.foundationId);

    // Actualizar fundación
    max.foundationId = leonardo._id;
    await max.save();

    console.log("\n✅ MAX ACTUALIZADO");
    console.log("  Nueva fundación:", max.foundationId);
    console.log("  Fundación nombre:", leonardo.name);

    // Verificar animales de la fundación
    console.log("\n📊 ANIMALES DE LA FUNDACIÓN PAE:");
    const animals = await Animal.find({ foundationId: leonardo._id });
    console.log("Total de animales:", animals.length);
    animals.forEach((a: any) => {
      console.log(`  - ${a.name} (${a.attributes?.breed || "sin raza"}) - Breed1Code: ${a.breed1Code}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMaxFoundation();
