import "server-only";
import { cache } from "react";
import { serializeService } from "@/lib/serialize";
import { Service, type ServiceLean } from "@/models/Service";
import type { ServiceDTO } from "@/types/content";
import { safeQuery } from "./safe";

/** Active services ordered by `order`, then name. */
export const getActiveServices = cache(async (): Promise<ServiceDTO[]> => {
  return safeQuery("getActiveServices", [], async () => {
    const docs = await Service.find({ active: true }).sort({ order: 1, name: 1 }).lean<ServiceLean[]>();
    return docs.map(serializeService);
  });
});

/** A single active service by slug, or null (e.g. to prefill the contact form). */
export const getServiceBySlug = cache(async (slug: string): Promise<ServiceDTO | null> => {
  if (!slug) return null;
  return safeQuery("getServiceBySlug", null, async () => {
    const doc = await Service.findOne({ active: true, slug: slug.toLowerCase() }).lean<ServiceLean>();
    return doc ? serializeService(doc) : null;
  });
});
