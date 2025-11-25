import mongoose from "mongoose";
import { User } from "../src/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://appuser:210403Leito@cluster0.bto72ng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixFoundationUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // 1. Buscar usuarios con el email lets.crp@outlook.com
    console.log("\n🔍 Buscando usuarios con email: lets.crp@outlook.com");
    const usersToDelete = await User.find({ email: "lets.crp@outlook.com" });
    
    if (usersToDelete.length > 0) {
      console.log(`📧 Encontrados ${usersToDelete.length} usuario(s):`);
      usersToDelete.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ID: ${user._id}`);
      });
      
      // Eliminar
      const result = await User.deleteMany({ email: "lets.crp@outlook.com" });
      console.log(`✅ Eliminados ${result.deletedCount} usuario(s)\n`);
    } else {
      console.log("ℹ️  No se encontraron usuarios con ese email\n");
    }

    // 2. Ver todos los usuarios de fundación
    console.log("🔍 Usuarios de fundación actuales:");
    const fundaciones = await User.find({ role: "FUNDACION" }).lean();
    
    fundaciones.forEach(fund => {
      console.log("\n📋 Usuario:", fund.email);
      console.log("   Nombre:", `${fund.profile.firstName} ${fund.profile.lastName}`);
      console.log("   foundationName:", fund.foundationName || "N/A");
      console.log("   organization.name:", fund.organization?.name || "N/A");
      console.log("   ID:", fund._id);
    });

    // 3. Actualizar "Fundación Demo" si no tiene organization
    console.log("\n🔧 Actualizando usuarios de fundación sin organization...");
    const fundacionDemo = await User.findOne({ 
      role: "FUNDACION",
      email: "fundacion@demo.com"
    });

    if (fundacionDemo && !fundacionDemo.organization?.name) {
      fundacionDemo.organization = {
        name: "PAE",
        description: "Fundación Protectora de Animales Ecuador"
      };
      await fundacionDemo.save();
      console.log("✅ Actualizado 'Fundación Demo' con organization: PAE");
    }

    console.log("\n✅ Proceso completado");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixFoundationUsers();
