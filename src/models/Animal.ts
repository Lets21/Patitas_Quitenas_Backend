import { Schema, model, Types } from "mongoose";

export type AnimalState = "AVAILABLE" | "RESERVED" | "ADOPTED";

const CoexistenceSchema = new Schema(
  {
    children: { type: Boolean, default: false },
    cats: { type: Boolean, default: false },
    dogs: { type: Boolean, default: false },
  },
  { _id: false }
);

const AttributesSchema = new Schema(
  {
    age: { type: Number, required: true }, // en años
    size: { type: String, enum: ["SMALL", "MEDIUM", "LARGE"], required: true },
    breed: { type: String, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    energy: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    coexistence: { type: CoexistenceSchema, required: true },
  },
  { _id: false }
);

const PersonalitySchema = new Schema(
  {
    sociability: { type: Number, min: 1, max: 5 },
    energy: { type: Number, min: 1, max: 5 },
    training: { type: Number, min: 1, max: 5 },
    adaptability: { type: Number, min: 1, max: 5 },
  },
  { _id: false }
);

const CompatibilitySchema = new Schema(
  {
    kids: { type: Boolean },
    cats: { type: Boolean },
    dogs: { type: Boolean },
    apartment: { type: Boolean },
  },
  { _id: false }
);

const ClinicalHistorySchema = new Schema(
  {
    lastVaccination: { type: String, default: null },
    sterilized: { type: Boolean },
    conditions: { type: String, default: null },
  },
  { _id: false }
);

const AnimalSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    photos: { type: [String], default: [] },
    attributes: { type: AttributesSchema, required: true },
    ageMonths: { type: Number }, // Edad en meses (opcional, se puede calcular de attributes.age)
    clinicalSummary: { type: String, default: "" },
    state: { type: String, enum: ["AVAILABLE", "RESERVED", "ADOPTED"], default: "AVAILABLE" },
    foundationId: { type: Types.ObjectId, ref: "User", required: true },
    // Nuevos campos opcionales
    personality: { type: PersonalitySchema, required: false },
    compatibility: { type: CompatibilitySchema, required: false },
    clinicalHistory: { type: ClinicalHistorySchema, required: false },
  },
  { timestamps: true }
);

// Búsqueda por nombre/raza
AnimalSchema.index({ name: "text", "attributes.breed": "text" });

export const Animal = model("Animal", AnimalSchema);
