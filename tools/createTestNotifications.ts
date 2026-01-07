// tools/createTestNotifications.ts
import mongoose from "mongoose";
import { Notification } from "../src/models/Notification";
import { User } from "../src/models/User";
import { Animal } from "../src/models/Animal";
import * as dotenv from "dotenv";

dotenv.config();

async function createTestNotifications() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/adopcion";
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Buscar una fundación
    const fundacion = await User.findOne({ role: "FUNDACION" });
    if (!fundacion) {
      console.error("❌ No se encontró ninguna fundación");
      process.exit(1);
    }
    console.log("✅ Fundación encontrada:", fundacion.email);

    // Buscar un animal de la fundación
    const animal = await Animal.findOne({ foundationId: fundacion._id });
    if (!animal) {
      console.error("❌ No se encontró ningún animal de esta fundación");
      process.exit(1);
    }
    console.log("✅ Animal encontrado:", animal.name);

    // Crear notificaciones de prueba
    const notifications = [
      {
        foundationId: fundacion._id,
        type: "adoption",
        title: "Nueva solicitud de adopción",
        message: `Juan Pérez ha enviado una solicitud para adoptar a ${animal.name}`,
        timestamp: new Date(),
        isRead: false,
        priority: "high",
        metadata: {
          animalName: animal.name,
          userName: "Juan Pérez"
        }
      },
      {
        foundationId: fundacion._id,
        type: "adoption",
        title: "Solicitud aprobada",
        message: `La solicitud de María García para adoptar a ${animal.name} ha sido aprobada`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        isRead: false,
        priority: "medium",
        metadata: {
          animalName: animal.name,
          userName: "María García"
        }
      },
      {
        foundationId: fundacion._id,
        type: "clinical",
        title: "Registro médico actualizado",
        message: `Se ha actualizado el historial médico de ${animal.name}`,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
        isRead: true,
        priority: "low",
        metadata: {
          animalName: animal.name
        }
      },
      {
        foundationId: fundacion._id,
        type: "system",
        title: "Bienvenido al sistema",
        message: "Gracias por registrarte en nuestra plataforma de adopción",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        isRead: true,
        priority: "low"
      },
      {
        foundationId: fundacion._id,
        type: "alert",
        title: "Atención requerida",
        message: `${animal.name} requiere vacunación urgente`,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        isRead: false,
        priority: "high",
        metadata: {
          animalName: animal.name
        }
      }
    ];

    // Eliminar notificaciones anteriores de prueba (opcional)
    await Notification.deleteMany({ foundationId: fundacion._id });
    console.log("🗑️  Notificaciones anteriores eliminadas");

    // Crear las notificaciones
    const created = await Notification.create(notifications);
    console.log(`✅ Se crearon ${created.length} notificaciones de prueba`);

    console.log("\n📊 Resumen:");
    console.log(`   - Adopciones: ${notifications.filter(n => n.type === 'adoption').length}`);
    console.log(`   - Clínicas: ${notifications.filter(n => n.type === 'clinical').length}`);
    console.log(`   - Sistema: ${notifications.filter(n => n.type === 'system').length}`);
    console.log(`   - Alertas: ${notifications.filter(n => n.type === 'alert').length}`);
    console.log(`   - Sin leer: ${notifications.filter(n => !n.isRead).length}`);

    await mongoose.disconnect();
    console.log("\n✅ Desconectado de MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestNotifications();
