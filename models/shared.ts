import { Schema, type Types } from "mongoose";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import type { SocialPlatform } from "@/types/content";

/* Raw (stored) shapes used by models and lib/serialize.ts. */

export interface MediaRefDoc {
  url: string;
  alt?: string;
  fileId?: string;
}

export interface SocialLinkDoc {
  platform: SocialPlatform;
  url: string;
}

export interface TimestampsDoc {
  createdAt: Date;
  updatedAt: Date;
}

/** A lean document as returned by `.lean<...>()`. */
export type Lean<T> = T & { _id: Types.ObjectId };

export const MediaRefSchema = new Schema<MediaRefDoc>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    fileId: { type: String, trim: true },
  },
  { _id: false },
);

export const SocialLinkSchema = new Schema<SocialLinkDoc>(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/** Key used by singleton documents (HomepageSettings, ContactInfo). */
export const SINGLETON_KEY = "default";
