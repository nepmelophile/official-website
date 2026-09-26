import mongoose, { Schema, type Model, type Types } from "mongoose";
import { ARTIST_MEDIA_TYPES, CONTENT_STATUSES, RELEASE_TYPES } from "@/lib/constants";
import type { ArtistMediaType, ContentStatus, ReleaseType } from "@/types/content";
import {
  MediaRefSchema,
  SocialLinkSchema,
  type Lean,
  type MediaRefDoc,
  type SocialLinkDoc,
  type TimestampsDoc,
} from "./shared";

export interface ReleaseDoc {
  title: string;
  embedUrl: string;
  type?: ReleaseType;
  releaseDate?: Date;
  coverImage?: MediaRefDoc;
}

export interface ArtistMediaDoc {
  type: ArtistMediaType;
  url: string;
  caption?: string;
  fileId?: string;
}

export interface AchievementDoc {
  title: string;
  year?: number;
  description?: string;
}

export interface ArtistDoc extends TimestampsDoc {
  name: string;
  slug: string;
  photo: MediaRefDoc;
  coverImage?: MediaRefDoc;
  shortBio: string;
  bio: string;
  genres: string[];
  location: string;
  socialLinks: SocialLinkDoc[];
  releases: ReleaseDoc[];
  media: ArtistMediaDoc[];
  achievements: AchievementDoc[];
  relatedArticleIds: Types.ObjectId[];
  featured: boolean;
  order: number;
  status: ContentStatus;
}

export type ArtistLean = Lean<ArtistDoc>;

const ReleaseSchema = new Schema<ReleaseDoc>(
  {
    title: { type: String, required: true, trim: true },
    embedUrl: { type: String, required: true, trim: true },
    type: { type: String, enum: RELEASE_TYPES },
    releaseDate: { type: Date },
    coverImage: { type: MediaRefSchema },
  },
  { _id: false },
);

const ArtistMediaSchema = new Schema<ArtistMediaDoc>(
  {
    type: { type: String, enum: ARTIST_MEDIA_TYPES, required: true },
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
    fileId: { type: String, trim: true },
  },
  { _id: false },
);

const AchievementSchema = new Schema<AchievementDoc>(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const ArtistSchema = new Schema<ArtistDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    photo: { type: MediaRefSchema, required: true },
    coverImage: { type: MediaRefSchema },
    shortBio: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    genres: { type: [String], default: [] },
    location: { type: String, default: "", trim: true },
    socialLinks: { type: [SocialLinkSchema], default: [] },
    releases: { type: [ReleaseSchema], default: [] },
    media: { type: [ArtistMediaSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
    relatedArticleIds: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: "draft", required: true },
  },
  { timestamps: true },
);

ArtistSchema.index({ status: 1, order: 1, name: 1 });
ArtistSchema.index({ status: 1, featured: 1, order: 1 });
ArtistSchema.index({ genres: 1 });

export const Artist: Model<ArtistDoc> =
  (mongoose.models.Artist as Model<ArtistDoc> | undefined) ??
  mongoose.model<ArtistDoc>("Artist", ArtistSchema);

export default Artist;
