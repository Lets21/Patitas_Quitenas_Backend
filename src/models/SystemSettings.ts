import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  systemName: string;
  contactEmail: string;
  maxUsers: number;
  sessionTimeout: number;
  maintenanceMode: boolean;
  autoBackup: "hourly" | "daily" | "weekly" | "monthly" | "disabled";
  logLevel: "error" | "warn" | "info" | "debug" | "verbose";
  emailNotifications: boolean;
  smsNotifications: boolean;
  maxFileSize: number;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    systemName: {
      type: String,
      required: true,
      default: "AdoptaConCausa",
    },
    contactEmail: {
      type: String,
      required: true,
      default: "admin@adoptaconcausa.com",
    },
    maxUsers: {
      type: Number,
      required: true,
      default: 5000,
      min: 1,
      max: 100000,
    },
    sessionTimeout: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 1440,
    },
    maintenanceMode: {
      type: Boolean,
      required: true,
      default: false,
    },
    autoBackup: {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly", "disabled"],
      default: "daily",
    },
    logLevel: {
      type: String,
      enum: ["error", "warn", "info", "debug", "verbose"],
      default: "info",
    },
    emailNotifications: {
      type: Boolean,
      required: true,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      required: true,
      default: false,
    },
    maxFileSize: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.model<ISystemSettings>(
  "SystemSettings",
  SystemSettingsSchema
);
