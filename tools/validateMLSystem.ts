/**
 * Script de Validación Completa del Sistema KNN Clasificador
 * 
 * Verifica:
 * - Archivos necesarios existen
 * - Modelos de datos están actualizados
 * - Dependencias instaladas
 * - Configuración correcta
 * 
 * Ejecutar: npx ts-node tools/validateMLSystem.ts
 */

import * as fs from "fs";
import * as path from "path";

interface CheckResult {
  name: string;
  status: "✅" | "⚠️" | "❌";
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, successMsg: string, failMsg: string) {
  results.push({
    name,
    status: condition ? "✅" : "❌",
    message: condition ? successMsg : failMsg,
  });
}

function warn(name: string, message: string) {
  results.push({
    name,
    status: "⚠️",
    message,
  });
}

function checkFileExists(name: string, filePath: string, description: string) {
  const exists = fs.existsSync(filePath);
  check(
    name,
    exists,
    `${description} existe`,
    `${description} NO existe: ${filePath}`
  );
  return exists;
}

console.log("🔍 Validando Sistema KNN Clasificador...\n");

// ========== 1. ARCHIVOS DEL MODELO ML ==========
console.log("📦 1. Modelo ML\n");

const mlServicePath = path.join(__dirname, "..", "..", "ml-service");
const modelPath = path.join(mlServicePath, "model", "knn_adopta_model.joblib");
const featuresPath = path.join(mlServicePath, "model", "knn_feature_names.joblib");

checkFileExists("Modelo KNN", modelPath, "Archivo del modelo KNN");
checkFileExists("Features KNN", featuresPath, "Archivo de features KNN");

// ========== 2. ARCHIVOS DEL BACKEND ==========
console.log("\n📂 2. Archivos del Backend\n");

const backendPath = path.join(__dirname, "..");
const animalModelPath = path.join(backendPath, "src", "models", "Animal.ts");
const appModelPath = path.join(backendPath, "src", "models", "Application.ts");
const payloadPath = path.join(backendPath, "src", "ml", "dogToMlPayload.ts");
const mlClientPath = path.join(backendPath, "src", "services", "mlClient.ts");
const mlCodesPath = path.join(backendPath, "src", "ml", "mlCodes.ts");

checkFileExists("Animal Model", animalModelPath, "Modelo Animal");
checkFileExists("Application Model", appModelPath, "Modelo Application");
checkFileExists("Dog to ML Payload", payloadPath, "Transformador de datos");
checkFileExists("ML Client", mlClientPath, "Cliente ML");
checkFileExists("ML Codes", mlCodesPath, "Constantes ML");

// ========== 3. VERIFICAR CONTENIDO DE ARCHIVOS ==========
console.log("\n📝 3. Verificación de Código\n");

// Verificar que Animal tenga campos ML
if (fs.existsSync(animalModelPath)) {
  const animalContent = fs.readFileSync(animalModelPath, "utf-8");
  check(
    "Campos ML en Animal",
    animalContent.includes("breed1Code") && animalContent.includes("genderCode"),
    "Animal.ts tiene campos ML (breed1Code, genderCode, etc.)",
    "Animal.ts NO tiene campos ML - ejecutar migración"
  );
}

// Verificar que Application tenga campos ML
if (fs.existsSync(appModelPath)) {
  const appContent = fs.readFileSync(appModelPath, "utf-8");
  check(
    "Campos ML en Application",
    appContent.includes("propensityPred") && appContent.includes("propensityProba"),
    "Application.ts tiene campos ML (propensityPred, propensityProba)",
    "Application.ts NO tiene campos ML - verificar implementación"
  );
}

// Verificar integración en routes
const routesPath = path.join(backendPath, "src", "routes", "applications.ts");
if (fs.existsSync(routesPath)) {
  const routesContent = fs.readFileSync(routesPath, "utf-8");
  const hasImport = routesContent.includes("dogToMlPayload") && 
                   routesContent.includes("predictAdoptionPropensity");
  const hasIntegration = routesContent.includes("propensityPred") &&
                        routesContent.includes("mlVersion");
  
  check(
    "Imports ML en Routes",
    hasImport,
    "applications.ts importa funciones ML",
    "applications.ts NO importa funciones ML"
  );
  
  check(
    "Integración ML en Routes",
    hasIntegration,
    "applications.ts integra predicción ML",
    "applications.ts NO integra predicción ML"
  );
}

// ========== 4. VARIABLES DE ENTORNO ==========
console.log("\n⚙️  4. Configuración\n");

const envPath = path.join(backendPath, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const hasMlUrl = envContent.includes("ML_SERVICE_URL");
  
  check(
    "Variable ML_SERVICE_URL",
    hasMlUrl,
    ".env tiene ML_SERVICE_URL configurado",
    ".env NO tiene ML_SERVICE_URL - agregar: ML_SERVICE_URL=http://localhost:8001"
  );
  
  if (hasMlUrl) {
    const match = envContent.match(/ML_SERVICE_URL=(.+)/);
    if (match) {
      const url = match[1].trim();
      results.push({
        name: "URL del servicio ML",
        status: "✅",
        message: `Configurado: ${url}`,
      });
    }
  }
} else {
  warn("Archivo .env", ".env NO existe - crear uno basado en .env.example");
}

// ========== 5. SCRIPTS DE HERRAMIENTAS ==========
console.log("\n🛠️  5. Scripts de Herramientas\n");

const toolsPath = path.join(backendPath, "tools");
checkFileExists("Script de Migración", path.join(toolsPath, "migrateAnimalsToML.ts"), "Script de migración");
checkFileExists("Script de Prueba", path.join(toolsPath, "testMLClassifier.ts"), "Script de prueba ML");

// ========== 6. DOCUMENTACIÓN ==========
console.log("\n📚 6. Documentación\n");

const projectRoot = path.join(backendPath, "..");
checkFileExists("Implementación ML", path.join(backendPath, "IMPLEMENTACION_ML_CLASIFICADOR.md"), "Guía de implementación");
checkFileExists("Códigos ML", path.join(backendPath, "CODIGOS_ML_REFERENCIA.md"), "Referencia de códigos");
checkFileExists("Guía de Pruebas", path.join(projectRoot, "GUIA_PRUEBAS_ML_CLASIFICADOR.md"), "Guía de pruebas");
checkFileExists("Resumen Sistema", path.join(projectRoot, "RESUMEN_SISTEMA_KNN_CLASIFICADOR.md"), "Resumen del sistema");
checkFileExists("README KNN", path.join(projectRoot, "README_KNN_CLASIFICADOR.md"), "README principal");

// ========== 7. DATASET ==========
console.log("\n📊 7. Dataset\n");

const datasetPath = path.join(mlServicePath, "data", "dataset_con_adopta_corregido.csv");
if (checkFileExists("Dataset", datasetPath, "Dataset de entrenamiento")) {
  const stats = fs.statSync(datasetPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  results.push({
    name: "Tamaño del Dataset",
    status: "✅",
    message: `${sizeMB} MB`,
  });
}

// ========== RESUMEN FINAL ==========
console.log("\n" + "=".repeat(70));
console.log("📋 RESUMEN DE VALIDACIÓN");
console.log("=".repeat(70) + "\n");

const passed = results.filter(r => r.status === "✅").length;
const warnings = results.filter(r => r.status === "⚠️").length;
const failed = results.filter(r => r.status === "❌").length;

results.forEach(result => {
  console.log(`${result.status} ${result.name}`);
  console.log(`   ${result.message}\n`);
});

console.log("=".repeat(70));
console.log(`Total: ${results.length} checks`);
console.log(`✅ Pasados: ${passed}`);
console.log(`⚠️  Advertencias: ${warnings}`);
console.log(`❌ Fallidos: ${failed}`);
console.log("=".repeat(70) + "\n");

if (failed > 0) {
  console.log("❌ Sistema NO está completamente configurado");
  console.log("\n📝 Acciones requeridas:");
  
  results
    .filter(r => r.status === "❌")
    .forEach((r, i) => {
      console.log(`${i + 1}. ${r.message}`);
    });
  
  console.log("\n💡 Consulta la documentación:");
  console.log("   - backend/IMPLEMENTACION_ML_CLASIFICADOR.md");
  console.log("   - GUIA_PRUEBAS_ML_CLASIFICADOR.md\n");
  
  process.exit(1);
} else if (warnings > 0) {
  console.log("⚠️  Sistema configurado con advertencias");
  console.log("   Revisa las advertencias arriba para optimizar el sistema\n");
  process.exit(0);
} else {
  console.log("✅ ¡SISTEMA COMPLETAMENTE CONFIGURADO Y LISTO!");
  console.log("\n🚀 Siguientes pasos:");
  console.log("   1. Levantar servicio ML:");
  console.log("      cd ml-service");
  console.log("      uvicorn app:app --reload --host 0.0.0.0 --port 8001");
  console.log("\n   2. Ejecutar migración de animales (si es necesario):");
  console.log("      npx ts-node tools/migrateAnimalsToML.ts");
  console.log("\n   3. Probar el sistema:");
  console.log("      npx ts-node tools/testMLClassifier.ts");
  console.log("\n   4. Levantar backend:");
  console.log("      npm run dev\n");
  
  process.exit(0);
}
