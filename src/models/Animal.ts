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
    coexistence: { type: CoexistenceSchema, required: false },
    
    // ========== CAMPOS ML LEGIBLES (HUMAN-READABLE) ==========
    // Estos campos se editarán en el formulario y luego se convertirán a códigos
    breed2: { type: String, default: null }, // Segunda raza (para mestizos)
    color1: { type: String, default: "Brown" }, // Color principal: Black, Brown, White, Yellow, Gray, etc.
    color2: { type: String, default: null }, // Color secundario
    color3: { type: String, default: null }, // Color terciario
    maturitySize: { type: String, enum: ["Small", "Medium", "Large", "Extra Large"], default: "Medium" }, // Tamaño cuando sea adulto
    furLength: { type: String, enum: ["Short", "Medium", "Long"], default: "Short" }, // Largo de pelo
    vaccinated: { type: String, enum: ["Yes", "No", "Not Sure"], default: "Not Sure" }, // Vacunado
    dewormed: { type: String, enum: ["Yes", "No", "Not Sure"], default: "Not Sure" }, // Desparasitado
    sterilized: { type: String, enum: ["Yes", "No", "Not Sure"], default: "Not Sure" }, // Esterilizado
    health: { type: String, enum: ["Healthy", "Minor Injury", "Serious Injury"], default: "Healthy" }, // Estado de salud
    fee: { type: Number, default: 0 }, // Tarifa de adopción (0 = gratis)
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
    
    // ========== CAMPOS PARA SISTEMA DE MATCHING ==========
    // Códigos numéricos según dataset PetFinder
    breed1Code: { type: Number, default: 0 }, // Breed1
    breed2Code: { type: Number, default: 0 }, // Breed2 (para mezclas)
    genderCode: { type: Number, default: 0 }, // 1=Male, 2=Female, 3=Mixed
    color1Code: { type: Number, default: 0 }, // Color principal
    color2Code: { type: Number, default: 0 }, // Color secundario
    color3Code: { type: Number, default: 0 }, // Color terciario
    maturitySizeCode: { type: Number, default: 0 }, // 1=Small, 2=Medium, 3=Large, 4=ExtraLarge
    furLengthCode: { type: Number, default: 0 }, // 1=Short, 2=Medium, 3=Long
    vaccinatedCode: { type: Number, default: 3 }, // 1=Yes, 2=No, 3=NotSure
    dewormedCode: { type: Number, default: 3 }, // 1=Yes, 2=No, 3=NotSure
    sterilizedCode: { type: Number, default: 3 }, // 1=Yes, 2=No, 3=NotSure
    healthCode: { type: Number, default: 1 }, // 1=Healthy, 2=MinorInjury, 3=SeriousInjury
    adoptionFee: { type: Number, default: 0 }, // Fee en moneda local
    photoCount: { type: Number, default: 0 }, // Cantidad de fotos
  },
  { timestamps: true }
);

// Búsqueda por nombre/raza
AnimalSchema.index({ name: "text", "attributes.breed": "text" });

export const Animal = model("Animal", AnimalSchema);
