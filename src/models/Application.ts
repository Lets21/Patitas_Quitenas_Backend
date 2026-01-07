// src/models/Application.ts
import { Schema, model, Types, Document } from "mongoose";

export type ApplicationStatus =
  | "RECEIVED"
  | "IN_REVIEW"
  | "HOME_VISIT"
  | "APPROVED"
  | "REJECTED";

export interface ApplicationDoc extends Document {
  animalId: Types.ObjectId;
  adopterId: Types.ObjectId;
  foundationId: Types.ObjectId;
  form: {
    homeType?: "casa" | "departamento" | "otro";
    hasYard?: boolean;
    hasChildren?: boolean;
    otherPets?: "ninguno" | "perro" | "gato" | "ambos" | string;
    activityLevel?: "bajo" | "medio" | "alto";
    hoursAway?: number; // 0–24
    budget?: "básico" | "medio" | "alto" | string;
    experience?: "primera_vez" | "con_experiencia" | string;
    notes?: string;
    // Nuevos campos del formulario oficial
    familyDecision?: "agree" | "accept" | "indifferent" | "disagree";
    monthlyBudget?: "high" | "medium" | "low";
    allowVisits?: "yes" | "no";
    acceptSterilization?: "yes" | "no";
    housing?: "Casa urbana" | "Casa de campo" | "Departamento" | "Quinta" | "Hacienda" | "Otro";
    relationAnimals?: "positive" | "neutral" | "negative";
    travelPlans?: "withOwner" | "withFamily" | "withFriend" | "paidCaretaker" | "hotel" | "other";
    behaviorResponse?: "trainOrAccept" | "seekHelp" | "punish" | "abandon";
    careCommitment?: "fullCare" | "mediumCare" | "lowCare";
  };
  status: ApplicationStatus;
  scorePct: number;
  scoreDetail: Record<string, { value: any; contribution: number }>;
  eligible: boolean;
  rejectReason?: string;
  // ML/KNN Clasificador
  propensityPred?: number; // 0 o 1
  propensityProba?: number; // 0 a 1
  mlVersion?: string; // "knn-v1"
  mlExplanation?: any; // Explicación detallada de la predicción ML
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<ApplicationDoc>(
  {
    animalId: {
      type: Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    adopterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // dueño del animal (usuario fundación)
    foundationId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    form: {
      homeType: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["casa", "departamento", "otro"],
        required: false,
      },
      hasYard: { type: Boolean, required: false },
      hasChildren: { type: Boolean, required: false },
      otherPets: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["ninguno", "perro", "gato", "ambos"],
        required: false,
      },
      activityLevel: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["bajo", "medio", "alto"],
        required: false,
      },
      hoursAway: {
        type: Number,
        min: 0,
        max: 24,
        required: false,
      },
      budget: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["básico", "medio", "alto"],
        required: false,
      },
      experience: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["primera_vez", "con_experiencia"],
        required: false,
      },
      notes: { type: String, trim: true },
      // Nuevos campos del formulario oficial
      familyDecision: {
        type: String,
        enum: ["agree", "accept", "indifferent", "disagree"],
        required: false,
      },
      monthlyBudget: {
        type: String,
        enum: ["high", "medium", "low"],
        required: false,
      },
      allowVisits: {
        type: String,
        enum: ["yes", "no"],
        required: false,
      },
      acceptSterilization: {
        type: String,
        enum: ["yes", "no"],
        required: false,
      },
      housing: {
        type: String,
        enum: ["Casa urbana", "Casa de campo", "Departamento", "Quinta", "Hacienda", "Otro"],
        required: false,
      },
      relationAnimals: {
        type: String,
        enum: ["positive", "neutral", "negative"],
        required: false,
      },
      travelPlans: {
        type: String,
        enum: ["withOwner", "withFamily", "withFriend", "paidCaretaker", "hotel", "other"],
        required: false,
      },
      behaviorResponse: {
        type: String,
        enum: ["trainOrAccept", "seekHelp", "punish", "abandon"],
        required: false,
      },
      careCommitment: {
        type: String,
        enum: ["fullCare", "mediumCare", "lowCare"],
        required: false,
      },
    },

    status: {
      type: String,
      enum: ["RECEIVED", "IN_REVIEW", "HOME_VISIT", "APPROVED", "REJECTED"],
      default: "RECEIVED",
      index: true,
      required: true,
    },
    scorePct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    scoreDetail: {
      type: Schema.Types.Mixed,
      default: {},
    },
    eligible: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectReason: {
      type: String,
      trim: true,
      required: false,
    },
    // ========== CAMPOS PARA ML/KNN CLASIFICADOR ==========
    propensityPred: {
      type: Number,
      enum: [0, 1],
      required: false,
      index: true,
      // 1 = Propenso a adoptar, 0 = No propenso
    },
    propensityProba: {
      type: Number,
      min: 0,
      max: 1,
      required: false,
      // Probabilidad de adopción (0 a 1)
    },
    mlVersion: {
      type: String,
      default: "knn-v1",
      required: false,
      // Versión del modelo ML usado para tesis
    },
    mlExplanation: {
      type: Schema.Types.Mixed,
      required: false,
      // Explicación detallada de la predicción ML (vecinos, factores clave, etc.)
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        // opcional: exponer id como string
        ret.id = ret._id?.toString?.();
        return ret;
      },
    },
  }
);

// Evita múltiples solicitudes iguales del mismo adoptante para el mismo animal
ApplicationSchema.index({ adopterId: 1, animalId: 1 }, { unique: true });

export const Application = model<ApplicationDoc>("Application", ApplicationSchema);
