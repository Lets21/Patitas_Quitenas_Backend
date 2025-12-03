import mongoose from "mongoose";
import app from "./server";

async function start() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }

  if (!process.env.JWT_ACCESS_SECRET && !process.env.JWT_SECRET) {
    console.error("Falta JWT_ACCESS_SECRET o JWT_SECRET en .env");
    process.exit(1);
  }
  // JWT_REFRESH_SECRET opcional si no usas refresh

  await mongoose.connect(mongoUri);
  console.log("MongoDB conectado");

  const PORT = Number(process.env.PORT ?? 4000); // default 4000 para el front
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});
