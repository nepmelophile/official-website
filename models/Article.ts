import mongoose, { Schema, type Model, type Types } from "mongoose";
import { CONTENT_STATUSES } from "@/lib/constants";
import type { ContentStatus } from "@/types/content";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface ArticleEmbedDoc {
  url: string;
  title?: string;
}

export interface ArticleDoc extends TimestampsDoc {
  title: string;
  slug: string;
  featuredImage: MediaRefDoc;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  author?: string;
  publishedAt: Date;
  status: ContentStatus;
  embeds: ArticleEmbedDoc[];
  relatedArticleIds: Types.ObjectId[];
  metaTitle?: string;
  metaDescription?: string;
}

export type ArticleLean = Lean<ArticleDoc>;

const EmbedSchema = new Schema<ArticleEmbedDoc>(
  {
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
  },
  { _id: false },
);

const ArticleSchema = new Schema<ArticleDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    featuredImage: { type: MediaRefSchema, required: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: { type: String, required: true, trim: true, index: true },
    tags: { type: [String], default: [] },
    author: { type: String, trim: true },
    publishedAt: { type: Date, required: true, default: () => new Date() },
    status: { type: String, enum: CONTENT_STATUSES, default: "draft", required: true },
    embeds: { type: [EmbedSchema], default: [] },
    relatedArticleIds: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true },
);

ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, category: 1, publishedAt: -1 });
ArticleSchema.index({ tags: 1 });

export const Article: Model<ArticleDoc> =
  (mongoose.models.Article as Model<ArticleDoc> | undefined) ??
  mongoose.model<ArticleDoc>("Article", ArticleSchema);

export default Article;
