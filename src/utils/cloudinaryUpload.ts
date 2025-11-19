// backend/src/utils/cloudinaryUpload.ts
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

/**
 * Sube una imagen a Cloudinary desde un buffer
 * @param buffer Buffer del archivo
 * @param folder Carpeta en Cloudinary (ej: "animals")
 * @returns URL pública de la imagen
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "animals"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ],
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Error uploading:", error);
          reject(error);
        } else if (result) {
          console.log("[Cloudinary] Upload successful:", result.secure_url);
          resolve(result.secure_url);
        } else {
          reject(new Error("No result from Cloudinary"));
        }
      }
    );

    // Convertir buffer a stream y hacer pipe
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Elimina una imagen de Cloudinary
 * @param imageUrl URL de la imagen en Cloudinary
 * @returns true si se eliminó correctamente
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    // Extraer el public_id de la URL
    // Ejemplo: https://res.cloudinary.com/demo/image/upload/v1234567890/animals/image.jpg
    // public_id = animals/image
    const parts = imageUrl.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return false;

    // Tomar desde después de "upload" y el número de versión
    const publicIdParts = parts.slice(uploadIndex + 2); // Saltar "upload" y versión
    const publicIdWithExt = publicIdParts.join("/");
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")); // Quitar extensión

    console.log("[Cloudinary] Deleting image with public_id:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("[Cloudinary] Delete result:", result);

    return result.result === "ok";
  } catch (error) {
    console.error("[Cloudinary] Error deleting image:", error);
    return false;
  }
}
