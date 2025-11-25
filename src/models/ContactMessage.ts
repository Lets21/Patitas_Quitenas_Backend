import { Schema, model, Document } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  destination?: string;
  subject: string;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["NEW", "READ", "REPLIED", "ARCHIVED"],
      default: "NEW",
    },
  },
  {
    timestamps: true,
  }
);

export const ContactMessage = model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema
);
