// src/models/Appointment.ts
import { Schema, model, Types, Document } from "mongoose";

export type AppointmentStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "RESCHEDULE_PROPOSED"
  | "RESCHEDULED"
  | "CANCELLED";

export interface RescheduleHistoryItem {
  proposedBy: "CLINIC" | "ADOPTER";
  proposedDateTime: Date;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  respondedAt?: Date;
  createdAt: Date;
}

export interface AppointmentDoc extends Document {
  adopterUserId: Types.ObjectId;
  animalId: Types.ObjectId;
  applicationId: Types.ObjectId;
  foundationId?: Types.ObjectId;
  clinicId?: Types.ObjectId; // null para Clínica UDLA (global)
  requestedDateTime: Date;
  status: AppointmentStatus;
  notes?: string;
  clinicResponseMessage?: string;
  proposedNewDateTime?: Date; // Última propuesta de reagendamiento
  rescheduleHistory?: RescheduleHistoryItem[]; // Historial completo de reagendamientos
  adopterResponseToReschedule?: "ACCEPTED" | "REJECTED" | "PROPOSED_NEW"; // Respuesta del adoptante a reagendamiento
  adopterProposedDateTime?: Date; // Si el adoptante propone nueva fecha
  adopterResponseMessage?: string; // Mensaje del adoptante al responder
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDoc>(
  {
    adopterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    animalId: {
      type: Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    foundationId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null, // null = Clínica UDLA (global)
    },
    requestedDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACCEPTED",
        "REJECTED",
        "RESCHEDULE_PROPOSED",
        "RESCHEDULED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      required: false,
    },
    clinicResponseMessage: {
      type: String,
      trim: true,
      required: false,
    },
    proposedNewDateTime: {
      type: Date,
      required: false,
    },
    rescheduleHistory: [
      {
        proposedBy: {
          type: String,
          enum: ["CLINIC", "ADOPTER"],
          required: true,
        },
        proposedDateTime: {
          type: Date,
          required: true,
        },
        message: {
          type: String,
          trim: true,
          required: false,
        },
        status: {
          type: String,
          enum: ["PENDING", "ACCEPTED", "REJECTED"],
          default: "PENDING",
          required: true,
        },
        respondedAt: {
          type: Date,
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
    adopterResponseToReschedule: {
      type: String,
      enum: ["ACCEPTED", "REJECTED", "PROPOSED_NEW"],
      required: false,
    },
    adopterProposedDateTime: {
      type: Date,
      required: false,
    },
    adopterResponseMessage: {
      type: String,
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString?.();
        return ret;
      },
    },
  }
);

// Índice compuesto para evitar múltiples citas activas para la misma aplicación
AppointmentSchema.index(
  { applicationId: 1, status: 1 },
  {
    partialFilterExpression: {
      status: { $in: ["REQUESTED", "ACCEPTED", "RESCHEDULE_PROPOSED", "RESCHEDULED"] },
    },
  }
);

export const Appointment = model<AppointmentDoc>("Appointment", AppointmentSchema);

