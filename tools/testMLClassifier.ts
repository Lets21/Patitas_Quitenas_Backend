/**
 * Script de prueba rápida del sistema ML clasificador
 * 
 * Verifica:
 * 1. Conexión con el servicio ML
 * 2. Formato correcto del payload
 * 3. Respuesta del modelo
 * 
 * Ejecutar:
 * npx ts-node tools/testMLClassifier.ts
 */

import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

// Payload de prueba con valores de ejemplo
const testPayload = {
  Type: 1,           // Perro
  Age: 24,           // 2 años
  Breed1: 265,       // Labrador
  Breed2: 0,         // Sin mezcla
  Gender: 1,         // Macho
  Color1: 1,         // Negro
  Color2: 2,         // Blanco
  Color3: 0,         // Sin tercer color
  MaturitySize: 2,   // Mediano
  FurLength: 1,      // Corto
  Vaccinated: 1,     // Sí
  Dewormed: 1,       // Sí
  Sterilized: 1,     // Sí
  Health: 1,         // Saludable
  Quantity: 1,       // 1 perro
  Fee: 0,            // Gratis
  VideoAmt: 0,       // Sin videos
  PhotoAmt: 5        // 5 fotos
};

async function testMLService() {
  console.log("🧪 Iniciando prueba del servicio ML...\n");

  // 1. Test de salud
  try {
    console.log("1️⃣  Verificando salud del servicio ML...");
    const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    console.log("✅ Servicio ML está activo");
    console.log(`   Features esperadas: ${healthResponse.data.features}\n`);
  } catch (error: any) {
    console.error("❌ Error al conectar con el servicio ML:");
    console.error(`   URL: ${ML_SERVICE_URL}`);
    console.error(`   Error: ${error.message}`);
    console.log("\n💡 Asegúrate de que el servicio ML esté corriendo:");
    console.log("   cd ml-service");
    console.log("   uvicorn app:app --reload --host 0.0.0.0 --port 8001\n");
    process.exit(1);
  }

  // 2. Test de predicción
  try {
    console.log("2️⃣  Probando predicción con payload de ejemplo...");
    console.log("   Payload:", JSON.stringify(testPayload, null, 2));
    
    const predResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      testPayload,
      { timeout: 8000 }
    );

    console.log("\n✅ Predicción exitosa!");
    console.log(`   pred (propensión): ${predResponse.data.pred} ${predResponse.data.pred === 1 ? '✅ Propenso a adoptar' : '❌ No propenso'}`);
    console.log(`   proba_adopta_1: ${(predResponse.data.proba_adopta_1 * 100).toFixed(2)}%`);
    
    console.log("\n📊 Interpretación:");
    if (predResponse.data.pred === 1) {
      console.log("   🎯 Este perro tiene ALTA probabilidad de ser adoptado");
      console.log("   según las características del modelo entrenado.");
    } else {
      console.log("   ⚠️  Este perro tiene BAJA probabilidad de ser adoptado");
      console.log("   según las características del modelo entrenado.");
    }
    
    console.log(`\n   Confianza: ${(predResponse.data.proba_adopta_1 * 100).toFixed(2)}%\n`);

  } catch (error: any) {
    console.error("\n❌ Error en la predicción:");
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Detalle:`, error.response.data);
      
      if (error.response.data?.error === "Faltan features") {
        console.log("\n💡 Faltan campos en el payload. Campos faltantes:");
        console.log("   ", error.response.data.missing.join(", "));
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }

  // 3. Test con diferentes escenarios
  console.log("\n3️⃣  Probando diferentes escenarios...\n");
  
  const scenarios = [
    {
      name: "Perro pequeño, joven, vacunado",
      payload: { ...testPayload, Age: 6, MaturitySize: 1, Vaccinated: 1, Sterilized: 1 }
    },
    {
      name: "Perro grande, adulto, sin vacunar",
      payload: { ...testPayload, Age: 60, MaturitySize: 3, Vaccinated: 2, Sterilized: 2 }
    },
    {
      name: "Cachorro mestizo",
      payload: { ...testPayload, Age: 3, Breed1: 307, MaturitySize: 1 }
    }
  ];

  for (const scenario of scenarios) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, scenario.payload);
      const icon = response.data.pred === 1 ? "✅" : "❌";
      const proba = (response.data.proba_adopta_1 * 100).toFixed(1);
      console.log(`   ${icon} ${scenario.name}: pred=${response.data.pred}, proba=${proba}%`);
    } catch (error) {
      console.log(`   ⚠️  ${scenario.name}: Error en predicción`);
    }
  }

  console.log("\n✅ Pruebas completadas exitosamente!");
  console.log("\n📝 Siguientes pasos:");
  console.log("   1. Ejecutar migración de animales: npx ts-node tools/migrateAnimalsToML.ts");
  console.log("   2. Levantar el backend: npm run dev");
  console.log("   3. Probar creando una solicitud de adopción desde el frontend");
  console.log("   4. Verificar que se guarden propensityPred y propensityProba\n");
}

// Ejecutar
testMLService().catch((error) => {
  console.error("\n❌ Error inesperado:", error);
  process.exit(1);
});
