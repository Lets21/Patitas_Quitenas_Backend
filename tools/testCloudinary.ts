// backend/tools/testCloudinary.ts
// Script para probar la conexión con Cloudinary
import cloudinary from "../src/config/cloudinary";

async function testCloudinary() {
  console.log("🔍 Probando conexión con Cloudinary...\n");

  try {
    // Verificar credenciales
    const config = cloudinary.config();
    console.log("📝 Configuración:");
    console.log("  Cloud Name:", config.cloud_name || "❌ NO CONFIGURADO");
    console.log("  API Key:", config.api_key ? "✅ Configurado" : "❌ NO CONFIGURADO");
    console.log("  API Secret:", config.api_secret ? "✅ Configurado" : "❌ NO CONFIGURADO");
    console.log();

    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      console.error("❌ Error: Faltan credenciales de Cloudinary");
      console.log("\n💡 Configura las variables de entorno en el archivo .env:");
      console.log("   CLOUDINARY_CLOUD_NAME=tu_cloud_name");
      console.log("   CLOUDINARY_API_KEY=tu_api_key");
      console.log("   CLOUDINARY_API_SECRET=tu_api_secret");
      process.exit(1);
    }

    // Probar conexión listando recursos
    console.log("🔄 Verificando conexión con Cloudinary API...");
    const result = await cloudinary.api.resources({
      resource_type: "image",
      max_results: 1,
    });

    console.log("✅ Conexión exitosa con Cloudinary!");
    console.log("📊 Recursos disponibles:", result.resources?.length || 0);
    console.log();

    // Mostrar información de la cuenta
    console.log("📦 Información de la cuenta:");
    console.log("  Rate limit remaining:", result.rate_limit_remaining);
    console.log("  Rate limit allowed:", result.rate_limit_allowed);
    console.log();

    console.log("🎉 Todo está configurado correctamente!");
  } catch (error: any) {
    console.error("❌ Error al conectar con Cloudinary:");
    console.error("  Mensaje:", error.message);
    
    if (error.http_code === 401) {
      console.error("\n💡 Error de autenticación. Verifica que:");
      console.error("   - El CLOUDINARY_API_KEY sea correcto");
      console.error("   - El CLOUDINARY_API_SECRET sea correcto");
    } else if (error.http_code === 404) {
      console.error("\n💡 Cloud Name no encontrado. Verifica que:");
      console.error("   - El CLOUDINARY_CLOUD_NAME sea correcto");
    }
    
    process.exit(1);
  }
}

testCloudinary();
