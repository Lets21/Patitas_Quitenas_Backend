// backend/tools/seed.ts
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Animal } from "../src/models/Animal";

async function seed() {
  // 1) Conexión
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("Falta MONGODB_URI en .env");
  await mongoose.connect(uri);
  console.log("→ Conectado a MongoDB");

  // 2) Limpiar demos previos
  await User.deleteMany({ email: /@demo\.com$/ });
  await Animal.deleteMany({});
  console.log("→ Limpiado usuarios @demo y animales");

  // 3) Crear usuarios demo
  const users = [
    { email: "admin@demo.com", role: "ADMIN",     firstName: "Administrador", lastName: "Demo" },
    { email: "adoptante@demo.com", role: "ADOPTANTE", firstName: "Ana",          lastName: "Adoptante" },
    { email: "fundacion@demo.com", role: "FUNDACION", firstName: "Fundación",    lastName: "Demo", foundationName: "Fundación PAE" },
    { email: "clinica@demo.com",   role: "CLINICA",   firstName: "Dra. María",   lastName: "Sánchez", clinicName: "Clínica UDLA" },
  ] as const;

  for (const u of users) {
    const user = new User({
      email: u.email,
      password: "demo123456", // se hashea en pre-save
      role: u.role,
      profile: { firstName: u.firstName, lastName: u.lastName },
      foundationName: (u as any).foundationName,
      clinicName: (u as any).clinicName,
      status: "ACTIVE",
    });
    await user.save();
  }
  console.log("→ Usuarios demo creados");

  // 4) Obtener fundación
  const foundation = await User.findOne({ email: "fundacion@demo.com" });
  if (!foundation) throw new Error("No se encontró la fundación demo");

  // helper para evitar typos en rutas
  const img = (name: string) => `/images/${name}.jpg`;

  // 5) Datos de animales demo (rutas en minúsculas)
  const now = new Date();
  const animals = [
    {
      name: "Shasta",
      photos: [img("shasta")],
      attributes: {
        age: 2,
        size: "MEDIUM",
        breed: "Mestizo",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: false, dogs: true },
      },
      clinicalSummary: "Saludable, vacunada y esterilizada",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Africa",
      photos: [img("africa")],
      attributes: {
        age: 4,
        size: "LARGE",
        breed: "Labrador Mix",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Muy saludable, requiere ejercicio diario",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Bimba",
      photos: [img("bimba")],
      attributes: {
        age: 1,
        size: "SMALL",
        breed: "Chihuahua Mix",
        gender: "FEMALE",
        energy: "LOW",
        coexistence: { children: false, cats: true, dogs: false },
      },
      clinicalSummary: "Muy tranquila, ideal para departamento",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Elena",
      photos: [img("elena")],
      attributes: {
        age: 3,
        size: "LARGE",
        breed: "Pastor Alemán",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: false, dogs: true },
      },
      clinicalSummary: "Fuerte y protectora, buena guardiana",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Lana",
      photos: [img("lana")],
      attributes: {
        age: 2,
        size: "MEDIUM",
        breed: "Beagle",
        gender: "FEMALE",
        energy: "HIGH",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Curiosa y juguetona, ideal familias activas",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Shanon",
      photos: [img("shanon")],
      attributes: {
        age: 1,
        size: "SMALL",
        breed: "Mestizo",
        gender: "FEMALE",
        energy: "LOW",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Dulce y sociable, se adapta fácil",
      state: "AVAILABLE",
      foundationId: foundation._id,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 6) Insertar
  await Animal.insertMany(animals);
  console.log(`→ Animales demo creados: ${animals.length}`);

  // 7) Cerrar
  await mongoose.disconnect();
  console.log("✔ Seed listo.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
