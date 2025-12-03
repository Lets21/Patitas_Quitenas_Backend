// backend/src/models/MedicalHistory.ts
import mongoose, { Schema, model, Types, Document } from "mongoose";

export interface IMedicalHistory extends Document {
  animalId: Types.ObjectId;
  lastVaccinationDate?: Date;
  sterilized?: boolean;
  conditions?: string;
  treatments: string[];
  vaccines: string[];
  surgeries: string[];
  nextAppointment?: Date | null;
  notes?: string;
  clinicUserId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const MedicalHistorySchema = new Schema<IMedicalHistory>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: "Animal", required: true },
    lastVaccinationDate: { type: Date },
    sterilized: { type: Boolean },
    conditions: { type: String },
    treatments: { type: [String], default: [] },
    vaccines: { type: [String], default: [] },
    surgeries: { type: [String], default: [] },
    nextAppointment: { type: Date, default: null },
    notes: { type: String },
    clinicUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Índice único: un animal solo puede tener un historial médico
MedicalHistorySchema.index({ animalId: 1 }, { unique: true });

export const MedicalHistory =
  mongoose.models.MedicalHistory || model<IMedicalHistory>("MedicalHistory", MedicalHistorySchema);

