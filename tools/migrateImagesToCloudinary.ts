// backend/tools/migrateImagesToCloudinary.ts
// Script para migrar imágenes locales existentes a Cloudinary
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Animal } from "../src/models/Animal";
import cloudinary from "../src/config/cloudinary";

dotenv.config();

async function findImageInUploads(animalName: string, originalPath: string): Promise<string | null> {
  const uploadsDir = path.join(process.cwd(), "uploads");
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const normalizedAnimalName = animalName.toLowerCase().replace(/\s+/g, "");
    
    // Buscar archivos que contengan el nombre del animal
    const matchingFiles = files.filter(file => {
      const normalized = file.toLowerCase().replace(/\s+/g, "");
      return normalized.includes(normalizedAnimalName) && 
             (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || 
              normalized.endsWith(".png") || normalized.endsWith(".webp"));
    });
    
    if (matchingFiles.length > 0) {
      // Usar el archivo más reciente
      const sortedFiles = matchingFiles.sort().reverse();
      return path.join(uploadsDir, sortedFiles[0]);
    }
  } catch (error) {
    // Ignorar errores al listar directorio
  }
  
  return null;
}

async function uploadLocalImageToCloudinary(localPath: string, animalName: string): Promise<string> {
  try {
    // Construir ruta absoluta del archivo local
    let fullPath: string;
    
    if (localPath.startsWith("/uploads/")) {
      // Formato antiguo: /uploads/imagen.jpg
      fullPath = path.join(process.cwd(), localPath);
    } else if (localPath.startsWith("uploads/")) {
      // Formato sin slash inicial
      fullPath = path.join(process.cwd(), localPath);
    } else if (localPath.startsWith("/images/")) {
      // Formato de imágenes públicas - intentar encontrar en uploads
      fullPath = path.join(process.cwd(), "uploads", path.basename(localPath));
    } else {
      // Ya es una ruta completa
      fullPath = localPath;
    }

    // Normalizar path para Windows
    fullPath = fullPath.replace(/\//g, path.sep);

    console.log(`  📤 Subiendo: ${localPath}`);
    console.log(`     Ruta completa: ${fullPath}`);

    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      console.log(`     ⚠️  Archivo no encontrado, buscando alternativa...`);
      
      // Intentar encontrar por nombre del animal
      const alternativePath = await findImageInUploads(animalName, localPath);
      if (alternativePath) {
        console.log(`     ✨ Encontrado: ${path.basename(alternativePath)}`);
        fullPath = alternativePath;
      } else {
        console.log(`     ❌ No se encontró ninguna imagen para ${animalName}`);
        return localPath; // Retornar la ruta original si no existe
      }
    }

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: "animals",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ],
    });

    console.log(`     ✅ Subido exitosamente`);
    console.log(`     🔗 URL: ${result.secure_url}`);

    return result.secure_url;
  } catch (error: any) {
    console.error(`     ❌ Error subiendo ${localPath}:`, error.message);
    return localPath; // Retornar la ruta original en caso de error
  }
}

async function migrateImages() {
  console.log("🚀 Iniciando migración de imágenes a Cloudinary...\n");

  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI no está definida en .env");
    }

    console.log("📡 Conectando a MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    // Verificar configuración de Cloudinary
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error("Cloudinary no está configurado correctamente en .env");
    }
    console.log("✅ Cloudinary configurado correctamente\n");

    // Buscar todos los animales
    console.log("🔍 Buscando animales con imágenes locales...");
    const animals = await Animal.find({});
    console.log(`📊 Total de animales encontrados: ${animals.length}\n`);

    let migratedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const animal of animals) {
      const photos = animal.photos || [];
      
      // Filtrar solo fotos que son rutas locales (no URLs de Cloudinary)
      const localPhotos = photos.filter(
        (photo) => 
          photo.startsWith("/uploads/") || 
          photo.startsWith("uploads/") ||
          (!photo.startsWith("http://") && !photo.startsWith("https://"))
      );

      if (localPhotos.length === 0) {
        console.log(`⏭️  ${animal.name}: Ya usa Cloudinary o no tiene fotos`);
        skippedCount++;
        continue;
      }

      console.log(`\n🐕 Migrando: ${animal.name} (${localPhotos.length} foto(s))`);

      const newPhotos: string[] = [];
      let hasChanges = false;

      for (const photo of photos) {
        if (
          photo.startsWith("/uploads/") || 
          photo.startsWith("uploads/") ||
          photo.startsWith("/images/") ||
          (!photo.startsWith("http://") && !photo.startsWith("https://"))
        ) {
          // Es una foto local, migrar
          const cloudinaryUrl = await uploadLocalImageToCloudinary(photo, animal.name);
          newPhotos.push(cloudinaryUrl);
          
          if (cloudinaryUrl !== photo && cloudinaryUrl.startsWith("https://")) {
            hasChanges = true;
          } else {
            errorCount++;
          }
        } else {
          // Ya es una URL de Cloudinary, mantener
          newPhotos.push(photo);
        }
      }

      // Actualizar en la base de datos si hubo cambios
      if (hasChanges) {
        animal.photos = newPhotos;
        await animal.save();
        console.log(`  💾 Actualizado en base de datos`);
        migratedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE MIGRACIÓN");
    console.log("=".repeat(60));
    console.log(`✅ Animales migrados: ${migratedCount}`);
    console.log(`⏭️  Animales omitidos (ya usan Cloudinary): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log("=".repeat(60));

    if (migratedCount > 0) {
      console.log("\n🎉 ¡Migración completada exitosamente!");
      console.log("\n💡 Ahora puedes:");
      console.log("   1. Verificar que las imágenes se vean en la webapp");
      console.log("   2. Si todo está bien, puedes eliminar la carpeta uploads/ local");
    } else {
      console.log("\n✨ No había imágenes para migrar o ya estaban en Cloudinary");
    }

  } catch (error: any) {
    console.error("\n❌ Error durante la migración:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Desconectado de MongoDB");
  }
}

// Ejecutar migración
migrateImages();
