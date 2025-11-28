// src/models/Notification.ts
import { Schema, model, Types, Document } from "mongoose";

export type NotificationType = "adoption" | "clinical" | "system" | "alert";
export type NotificationPriority = "low" | "medium" | "high";

export interface NotificationDoc extends Document {
  foundationId: Types.ObjectId;
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
  foundationId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

export const Notification = model<NotificationDoc>("Notification", NotificationSchema);
