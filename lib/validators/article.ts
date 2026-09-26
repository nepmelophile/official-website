import { z } from "zod";
import {
  dateDefaultNow,
  embedUrlSchema,
  mediaRefSchema,
  objectIdList,
  objectList,
  optionalText,
  requiredText,
  slugSchema,
  statusSchema,
  stringList,
} from "./common";

export const articleEmbedSchema = z.object({
  url: embedUrlSchema,
  title: optionalText(150, "Embed title"),
});

/** Admin create/update payload for an Article. */
export const articleSchema = z.object({
  title: requiredText(200, "Title"),
  slug: slugSchema,
  featuredImage: mediaRefSchema,
  excerpt: requiredText(400, "Excerpt"),
  body: requiredText(50_000, "Body"),
  category: requiredText(60, "Category"),
  tags: stringList(20, 40),
  author: optionalText(100, "Author"),
  publishedAt: dateDefaultNow,
  status: statusSchema,
  embeds: objectList(articleEmbedSchema, 10),
  relatedArticleIds: objectIdList(12),
  metaTitle: optionalText(120, "Meta title"),
  metaDescription: optionalText(320, "Meta description"),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type ArticleFormValues = z.input<typeof articleSchema>;
