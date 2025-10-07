// backend/src/models/ClinicalRecord.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClinicalRecord extends Document {
  animalId: Types.ObjectId;
  vaccinations: { name: string; date: Date; nextDue?: Date }[];
  sterilized: boolean;
  dewormings: { type: string; date: Date; nextDue?: Date }[];
  diagnoses: string[];
  treatments: string[];
  vetNotes: string;
  clinicUserId: Types.ObjectId;
  approved?: boolean;
}

const VaccinationSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    nextDue: { type: Date },
  },
  { _id: false }
);

const DewormingSchema = new Schema(
  {
    type: { type: String, required: true },
    date: { type: Date, required: true },
    nextDue: { type: Date },
  },
  { _id: false }
);

const ClinicalRecordSchema = new Schema<IClinicalRecord>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: "Animal", required: true, index: true },
    vaccinations: { type: [VaccinationSchema], default: [] },
    sterilized: { type: Boolean, default: false },
    dewormings: { type: [DewormingSchema], default: [] },
    diagnoses: { type: [String], default: [] },
    treatments: { type: [String], default: [] },
    vetNotes: { type: String, default: "" },
    clinicUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ClinicalRecord =
  mongoose.models.ClinicalRecord ||
  mongoose.model<IClinicalRecord>("ClinicalRecord", ClinicalRecordSchema);

export default ClinicalRecord;
