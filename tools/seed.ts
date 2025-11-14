// backend/tools/seed.ts
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Animal } from "../src/models/Animal";
import { Application } from "../src/models/Application";

async function seed() {
  // 1) Conexión
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("Falta MONGODB_URI en .env");
  await mongoose.connect(uri);
  console.log("→ Conectado a MongoDB");

  // 2) Limpiar demos previos
  await User.deleteMany({ email: /@demo\.com$/ });
  await Animal.deleteMany({});
  await Application.deleteMany({});
  console.log("→ Limpiado usuarios @demo, animales y solicitudes");

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

  // Helper para crear fechas pasadas
  const monthsAgo = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  };

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
      personality: { sociability: 4, energy: 3, training: 4, adaptability: 5 },
      compatibility: { kids: true, cats: false, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2025-01-10", sterilized: true, conditions: "Ninguna" },
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
      personality: { sociability: 5, energy: 5, training: 3, adaptability: 4 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: false },
      clinicalHistory: { lastVaccination: "2025-02-15", sterilized: true, conditions: "Ninguna" },
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
      createdAt: monthsAgo(2), // Registrado hace 2 meses
      updatedAt: now,
    },
    {
      name: "Africa",
      photos: [img("africa")],
      attributes: {
        age: 4,
        size: "MEDIUM",
        breed: "Cocker Spaniel",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Cariñosa y bien educada",
      state: "AVAILABLE",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 3, training: 4, adaptability: 5 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2024-12-20", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(3), // Registrado hace 3 meses
      updatedAt: now,
    },
    {
      name: "Thor",
      photos: [img("thor")],
      attributes: {
        age: 5,
        size: "LARGE",
        breed: "Dogo Argentino",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: false, cats: false, dogs: false },
      },
      clinicalSummary: "Necesita dueño experimentado",
      state: "AVAILABLE",
      foundationId: foundation._id,
      personality: { sociability: 2, energy: 5, training: 3, adaptability: 2 },
      compatibility: { kids: false, cats: false, dogs: false, apartment: false },
      clinicalHistory: { lastVaccination: "2024-11-30", sterilized: true, conditions: "Historial de agresividad" },
      createdAt: monthsAgo(5), // Registrado hace 5 meses
      updatedAt: now,
    },
    {
      name: "Nina",
      photos: [img("nina")],
      attributes: {
        age: 2,
        size: "SMALL",
        breed: "French Bulldog",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Compañera ideal para departamento",
      state: "AVAILABLE",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 3, training: 4, adaptability: 5 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2025-02-20", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(1.5), // Registrado hace 1.5 meses
      updatedAt: now,
    },
  ];

  // Actualizar fechas de registro de algunos animales para distribución temporal
  animals[0].createdAt = monthsAgo(4); // Shasta registrada hace 4 meses
  animals[1].createdAt = monthsAgo(0.5); // Bimba registrada hace 15 días
  animals[2].createdAt = monthsAgo(3.5); // Elena registrada hace 3.5 meses
  animals[3].createdAt = monthsAgo(1); // Lana registrada hace 1 mes

  // 6) Insertar animales
  const insertedAnimals = await Animal.insertMany(animals);
  console.log(`→ Animales demo creados: ${animals.length}`);

  // 7) Crear animales ADOPTADOS (histórico de adopciones) - Últimos 6 meses
  const adoptedAnimals = [
    {
      name: "Max",
      photos: [img("max")],
      attributes: {
        age: 3,
        size: "MEDIUM",
        breed: "Golden Retriever Mix",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Muy saludable y enérgico",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 5, training: 4, adaptability: 5 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: false },
      clinicalHistory: { lastVaccination: "2024-12-20", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(5),
      updatedAt: monthsAgo(1), // Adoptado hace 1 mes
    },
    {
      name: "Luna",
      photos: [img("luna")],
      attributes: {
        age: 2,
        size: "SMALL",
        breed: "Poodle Mix",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Perfecta para departamento",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 3, training: 5, adaptability: 5 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2025-01-05", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(4),
      updatedAt: monthsAgo(0.5), // Adoptado hace 15 días
    },
    {
      name: "Rocky",
      photos: [img("rocky")],
      attributes: {
        age: 4,
        size: "LARGE",
        breed: "Pastor Alemán",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: true, cats: false, dogs: true },
      },
      clinicalSummary: "Excelente guardián",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 4, energy: 5, training: 5, adaptability: 4 },
      compatibility: { kids: true, cats: false, dogs: true, apartment: false },
      clinicalHistory: { lastVaccination: "2024-11-15", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(5.5),
      updatedAt: monthsAgo(2), // Adoptado hace 2 meses
    },
    {
      name: "Bella",
      photos: [img("bella")],
      attributes: {
        age: 1,
        size: "MEDIUM",
        breed: "Cocker Spaniel",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Muy cariñosa y juguetona",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 4, training: 3, adaptability: 4 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2025-02-01", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(3),
      updatedAt: monthsAgo(0.2), // Adoptado hace 6 días
    },
    {
      name: "Toby",
      photos: [img("toby")],
      attributes: {
        age: 5,
        size: "SMALL",
        breed: "Schnauzer",
        gender: "MALE",
        energy: "LOW",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Tranquilo y obediente",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 4, energy: 2, training: 5, adaptability: 5 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2024-10-20", sterilized: true, conditions: "Artritis leve" },
      createdAt: monthsAgo(5),
      updatedAt: monthsAgo(3), // Adoptado hace 3 meses
    },
    {
      name: "Coco",
      photos: [img("coco")],
      attributes: {
        age: 2,
        size: "SMALL",
        breed: "Yorkshire Terrier",
        gender: "FEMALE",
        energy: "MEDIUM",
        coexistence: { children: true, cats: true, dogs: true },
      },
      clinicalSummary: "Muy pequeña y adorable",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 3, training: 3, adaptability: 4 },
      compatibility: { kids: true, cats: true, dogs: true, apartment: true },
      clinicalHistory: { lastVaccination: "2025-01-20", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(4),
      updatedAt: monthsAgo(1.5), // Adoptado hace 1.5 meses
    },
    {
      name: "Duke",
      photos: [img("duke")],
      attributes: {
        age: 3,
        size: "LARGE",
        breed: "Rottweiler",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: true, cats: false, dogs: true },
      },
      clinicalSummary: "Fuerte y protector",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 3, energy: 5, training: 4, adaptability: 3 },
      compatibility: { kids: true, cats: false, dogs: true, apartment: false },
      clinicalHistory: { lastVaccination: "2024-12-10", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(5),
      updatedAt: monthsAgo(4), // Adoptado hace 4 meses
    },
    {
      name: "Milo",
      photos: [img("milo")],
      attributes: {
        age: 1,
        size: "MEDIUM",
        breed: "Husky",
        gender: "MALE",
        energy: "HIGH",
        coexistence: { children: true, cats: false, dogs: true },
      },
      clinicalSummary: "Muy enérgico y juguetón",
      state: "ADOPTED",
      foundationId: foundation._id,
      personality: { sociability: 5, energy: 5, training: 2, adaptability: 3 },
      compatibility: { kids: true, cats: false, dogs: true, apartment: false },
      clinicalHistory: { lastVaccination: "2025-02-05", sterilized: true, conditions: "Ninguna" },
      createdAt: monthsAgo(2),
      updatedAt: monthsAgo(0.7), // Adoptado hace 3 semanas
    },
  ];

  await Animal.insertMany(adoptedAnimals);
  console.log(`→ Animales adoptados creados: ${adoptedAnimals.length}`);

  // 8) Crear adoptantes demo
  const adopters = [];
  for (let i = 1; i <= 10; i++) {
    const adopter = new User({
      email: `adoptante${i}@demo.com`,
      password: "demo123456",
      role: "ADOPTANTE",
      profile: { firstName: `Adoptante${i}`, lastName: `Demo` },
      status: "ACTIVE",
    });
    await adopter.save();
    adopters.push(adopter);
  }
  console.log(`→ Adoptantes creados: ${adopters.length}`);

  // 9) Crear solicitudes de adopción (applications)
  const applications = [];
  
  // Solicitudes para Shasta (el perro más popular)
  for (let i = 0; i < 5; i++) {
    applications.push({
      animalId: insertedAnimals[0]._id, // Shasta
      adopterId: adopters[i]._id,
      foundationId: foundation._id,
      form: {
        homeType: i % 2 === 0 ? "casa" : "departamento",
        hasYard: i % 2 === 0,
        hasChildren: i % 3 === 0,
        otherPets: i % 2 === 0 ? "perro" : "ninguno",
        activityLevel: "medio",
        hoursAway: 6 + i,
        budget: "medio",
        experience: i % 2 === 0 ? "con_experiencia" : "primera_vez",
        notes: `Solicitud de prueba ${i + 1}`,
      },
      status: ["RECEIVED", "IN_REVIEW", "APPROVED"][i % 3] as any,
      scorePct: 70 + (i * 5),
      scoreDetail: {},
      eligible: true,
      createdAt: monthsAgo(Math.floor(i / 2)),
      updatedAt: new Date(),
    });
  }

  // Solicitudes para Lana (segundo más popular)
  for (let i = 0; i < 3; i++) {
    applications.push({
      animalId: insertedAnimals[4]._id, // Lana
      adopterId: adopters[i + 5]._id,
      foundationId: foundation._id,
      form: {
        homeType: "casa",
        hasYard: true,
        hasChildren: true,
        otherPets: "perro",
        activityLevel: "alto",
        hoursAway: 4,
        budget: "alto",
        experience: "con_experiencia",
        notes: `Familia activa interesada en Lana`,
      },
      status: ["RECEIVED", "IN_REVIEW", "HOME_VISIT"][i] as any,
      scorePct: 85 + (i * 3),
      scoreDetail: {},
      eligible: true,
      createdAt: monthsAgo(1),
      updatedAt: new Date(),
    });
  }

  // Solicitudes para Elena
  for (let i = 0; i < 2; i++) {
    applications.push({
      animalId: insertedAnimals[3]._id, // Elena
      adopterId: adopters[i + 8]._id,
      foundationId: foundation._id,
      form: {
        homeType: "casa",
        hasYard: true,
        hasChildren: false,
        otherPets: "ninguno",
        activityLevel: "medio",
        hoursAway: 8,
        budget: "medio",
        experience: "con_experiencia",
        notes: `Interesado en pastor alemán`,
      },
      status: i === 0 ? "RECEIVED" : "IN_REVIEW",
      scorePct: 75,
      scoreDetail: {},
      eligible: true,
      createdAt: monthsAgo(0),
      updatedAt: new Date(),
    });
  }

  // Solicitudes rechazadas y otras
  applications.push(
    {
      animalId: insertedAnimals[1]._id, // Africa
      adopterId: adopters[3]._id,
      foundationId: foundation._id,
      form: {
        homeType: "departamento",
        hasYard: false,
        hasChildren: true,
        otherPets: "ninguno",
        activityLevel: "bajo",
        hoursAway: 12,
        budget: "básico",
        experience: "primera_vez",
        notes: `Primera vez con mascota`,
      },
      status: "REJECTED",
      scorePct: 45,
      scoreDetail: {},
      eligible: false,
      createdAt: monthsAgo(2),
      updatedAt: monthsAgo(1),
    },
    {
      animalId: insertedAnimals[2]._id, // Bimba
      adopterId: adopters[4]._id,
      foundationId: foundation._id,
      form: {
        homeType: "departamento",
        hasYard: false,
        hasChildren: false,
        otherPets: "gato",
        activityLevel: "bajo",
        hoursAway: 4,
        budget: "medio",
        experience: "con_experiencia",
        notes: `Ideal para departamento`,
      },
      status: "APPROVED",
      scorePct: 92,
      scoreDetail: {},
      eligible: true,
      createdAt: monthsAgo(0),
      updatedAt: new Date(),
    }
  );

  await Application.insertMany(applications);
  console.log(`→ Solicitudes creadas: ${applications.length}`);

  // 10) Cerrar
  await mongoose.disconnect();
  console.log("✔ Seed completado con éxito.");
  console.log("\n📊 Resumen:");
  console.log(`   • ${animals.length} animales disponibles`);
  console.log(`   • ${adoptedAnimals.length} animales adoptados`);
  console.log(`   • ${adopters.length} adoptantes`);
  console.log(`   • ${applications.length} solicitudes de adopción`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
