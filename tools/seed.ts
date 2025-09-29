import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await User.deleteMany({ email: /@demo\.com$/ });

  const users = [
    { email: "admin@demo.com", role: "ADMIN", firstName: "Administrador", lastName: "Demo" },
    { email: "adoptante@demo.com", role: "ADOPTANTE", firstName: "Ana", lastName: "Adoptante" },
    { email: "fundacion@demo.com", role: "FUNDACION", firstName: "Fundación", lastName: "Demo", foundationName: "Fundación PAE" },
    { email: "clinica@demo.com", role: "CLINICA", firstName: "Dra. María", lastName: "Sánchez", clinicName: "Clínica UDLA" }
  ] as const;

  for (const u of users) {
    const user = new User({
      email: u.email,
      password: "demo123456", // se hace hash en pre-save
      role: u.role,
      profile: { firstName: u.firstName, lastName: u.lastName },
      foundationName: (u as any).foundationName,
      clinicName: (u as any).clinicName,
      status: "ACTIVE",
    });
    await user.save();
  }

  console.log("Seed listo.");
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
