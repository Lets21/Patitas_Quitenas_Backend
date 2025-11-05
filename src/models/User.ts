import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

export type Role = "ADMIN" | "ADOPTANTE" | "FUNDACION" | "CLINICA";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export type SizePref = "SMALL" | "MEDIUM" | "LARGE";
export type EnergyLevel = "LOW" | "MEDIUM" | "HIGH";
export type OtherPets = "none" | "dog" | "cat" | "both";

interface Preferences {
  preferredSize: SizePref;
  preferredEnergy: EnergyLevel;
  hasChildren: boolean;
  otherPets: OtherPets;   // none/dog/cat/both
  dwelling: string;       // house/apartment/etc.
  completed: boolean;     // si ya hizo onboarding
}

interface Profile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  preferences?: Preferences;
}

export interface IUser {
  email: string;
  password: string;
  role: Role;
  profile: Profile;
  status: UserStatus;
  foundationName?: string; // opcional para FUNDACION
  clinicName?: string;     // opcional para CLINICA
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN","ADOPTANTE","FUNDACION","CLINICA"], required: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: String,
      address: String,
      preferences: {
        preferredSize: {
          type: String,
          enum: ["SMALL", "MEDIUM", "LARGE"],
          default: "MEDIUM",
        },
        preferredEnergy: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH"],
          default: "MEDIUM",
        },
        hasChildren: { type: Boolean, default: false },
        otherPets: { type: String, enum: ["none", "dog", "cat", "both"], default: "none" },
        dwelling: { type: String, default: "" },
        completed: { type: Boolean, default: false },
      },
    },
    status: { type: String, enum: ["ACTIVE","SUSPENDED"], default: "ACTIVE" },
    foundationName: String,
    clinicName: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  // @ts-ignore
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidate: string) {
  // @ts-ignore
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
