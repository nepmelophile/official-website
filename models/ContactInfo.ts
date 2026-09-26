import mongoose, { Schema, type Model } from "mongoose";
import { SINGLETON_KEY, SocialLinkSchema, type Lean, type SocialLinkDoc, type TimestampsDoc } from "./shared";

export interface ContactInfoDoc extends TimestampsDoc {
  /** Singleton key — always 'default'. */
  key: string;
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl?: string;
  officeHours?: string;
  socialLinks: SocialLinkDoc[];
}

export type ContactInfoLean = Lean<ContactInfoDoc>;

const ContactInfoSchema = new Schema<ContactInfoDoc>(
  {
    key: { type: String, required: true, unique: true, default: SINGLETON_KEY },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    mapEmbedUrl: { type: String, trim: true },
    officeHours: { type: String, trim: true },
    socialLinks: { type: [SocialLinkSchema], default: [] },
  },
  { timestamps: true, collection: "contactinfo" },
);

export const ContactInfo: Model<ContactInfoDoc> =
  (mongoose.models.ContactInfo as Model<ContactInfoDoc> | undefined) ??
  mongoose.model<ContactInfoDoc>("ContactInfo", ContactInfoSchema);

export default ContactInfo;
