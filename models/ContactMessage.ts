import mongoose, { Schema, type Model } from "mongoose";
import { CONTACT_MESSAGE_STATUSES } from "@/lib/constants";
import type { ContactMessageStatus } from "@/types/content";
import type { Lean, TimestampsDoc } from "./shared";

export interface ContactMessageDoc extends TimestampsDoc {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  service?: string;
  message: string;
  status: ContactMessageStatus;
}

export type ContactMessageLean = Lean<ContactMessageDoc>;

const ContactMessageSchema = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    service: { type: String, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: CONTACT_MESSAGE_STATUSES, default: "new", required: true },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage: Model<ContactMessageDoc> =
  (mongoose.models.ContactMessage as Model<ContactMessageDoc> | undefined) ??
  mongoose.model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
