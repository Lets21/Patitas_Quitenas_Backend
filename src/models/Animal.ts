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

const AnimalSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    photos: { type: [String], default: [] },
    attributes: { type: AttributesSchema, required: true },
    clinicalSummary: { type: String, default: "" },
    state: { type: String, enum: ["AVAILABLE", "RESERVED", "ADOPTED"], default: "AVAILABLE" },
    foundationId: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Búsqueda por nombre/raza
AnimalSchema.index({ name: "text", "attributes.breed": "text" });

export const Animal = model("Animal", AnimalSchema);
