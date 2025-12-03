import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Animal } from "../src/models/Animal";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://appuser:210403Leito@cluster0.bto72ng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateAnimals() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // Buscar el usuario viejo
    const oldFoundation = await User.findOne({ email: "fundacion@demo.com" });
    if (!oldFoundation) {
      console.log("❌ No se encontró fundacion@demo.com");
      process.exit(1);
    }

    // Buscar el usuario nuevo
    const newFoundation = await User.findOne({ email: "lets.crp@outlook.com" });
    if (!newFoundation) {
      console.log("❌ No se encontró lets.crp@outlook.com");
      process.exit(1);
    }

    console.log(`\n📋 Fundación antigua: ${oldFoundation.email} (ID: ${oldFoundation._id})`);
    console.log(`📋 Fundación nueva: ${newFoundation.email} (ID: ${newFoundation._id})`);

    // Contar animales de la fundación antigua
    const animalCount = await Animal.countDocuments({ foundationId: oldFoundation._id });
    console.log(`\n🐕 Animales encontrados: ${animalCount}`);

    if (animalCount === 0) {
      console.log("ℹ️  No hay animales para migrar");
      process.exit(0);
    }

    // Migrar animales
    const result = await Animal.updateMany(
      { foundationId: oldFoundation._id },
      { $set: { foundationId: newFoundation._id } }
    );

    console.log(`\n✅ Migrados ${result.modifiedCount} animales de:`);
    console.log(`   ${oldFoundation.email} → ${newFoundation.email}`);

    // Verificar
    const newCount = await Animal.countDocuments({ foundationId: newFoundation._id });
    console.log(`\n🎉 Total de animales en la nueva fundación: ${newCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

migrateAnimals();
