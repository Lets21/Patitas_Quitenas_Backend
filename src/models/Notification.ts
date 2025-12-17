// src/models/Notification.ts
import { Schema, model, Types, Document } from "mongoose";

export type NotificationType = "adoption" | "clinical" | "system" | "alert";
export type NotificationPriority = "low" | "medium" | "high";

export interface NotificationDoc extends Document {
  foundationId?: Types.ObjectId;
  clinicId?: Types.ObjectId;
  userId?: Types.ObjectId; // Para notificaciones de usuarios adoptantes
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: {
    animalName?: string;
    userName?: string;
    clinicName?: string;
  };
}

const NotificationSchema = new Schema<NotificationDoc>({
  foundationId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  clinicId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Para usuarios adoptantes
  type: { type: String, enum: ["adoption", "clinical", "system", "alert"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ["low", "medium", "high"], default: "low" },
  actionUrl: { type: String },
  metadata: {
    animalName: { type: String },
    userName: { type: String },
    clinicName: { type: String },
  },
});

// Validación: al menos uno de foundationId, clinicId o userId debe estar presente
// clinicId puede ser null para notificaciones globales de clínicas
NotificationSchema.pre("validate", function(next) {
  const hasFoundation = !!this.foundationId;
  const hasClinic = this.clinicId !== undefined; // null es válido (notificación global)
  const hasUser = !!this.userId;
  
  if (!hasFoundation && !hasClinic && !hasUser) {
    return next(new Error("Al menos uno de foundationId, clinicId o userId debe estar presente"));
  }
  next();
});

export const Notification = model<NotificationDoc>("Notification", NotificationSchema);
