import "server-only";
import { toObjectId } from "@/lib/admin/actions";
import { searchRegex } from "@/lib/admin/list";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeTestimonial } from "@/lib/serialize";
import { Testimonial, type TestimonialLean } from "@/models/Testimonial";
import type { TestimonialDTO } from "@/types/content";

/*
 * Admin read helpers for Testimonials (inactive ones included). Call only after requireAdmin().
 */

export type TestimonialActiveFilter = "" | "active" | "inactive";

export interface AdminTestimonialList {
  items: TestimonialDTO[];
  error?: string;
}

/** Every testimonial in public display order (order ↑, newest first), filtered by text and status. */
export async function listAdminTestimonials({
  q = "",
  status = "",
}: { q?: string; status?: TestimonialActiveFilter } = {}): Promise<AdminTestimonialList> {
  if (!isDbConfigured()) {
    return { items: [], error: "The database is not configured (MONGODB_URI is missing)." };
  }
  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (q) filter.$or = [{ name: searchRegex(q) }, { designation: searchRegex(q) }, { quote: searchRegex(q) }];
    if (status) filter.active = status === "active" ? true : { $ne: true };
    const docs = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 }).lean<TestimonialLean[]>();
    return { items: docs.map(serializeTestimonial) };
  } catch (error) {
    console.error("[melophile admin] listAdminTestimonials failed", error);
    return { items: [], error: "Could not load testimonials — is the database reachable?" };
  }
}

/** One testimonial by id (null for a malformed or unknown id). Throws when the DB is unavailable. */
export async function getAdminTestimonial(id: string): Promise<TestimonialDTO | null> {
  const oid = toObjectId(id);
  if (!oid) return null;
  await connectToDatabase();
  const doc = await Testimonial.findById(oid).lean<TestimonialLean>();
  return doc ? serializeTestimonial(doc) : null;
}

/** Suggested `order` for a new testimonial: one step after the current last one. */
export async function getNextTestimonialOrder(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    await connectToDatabase();
    const last = await Testimonial.findOne({}, { order: 1 })
      .sort({ order: -1 })
      .lean<Pick<TestimonialLean, "_id" | "order">>();
    return last ? (last.order ?? 0) + 1 : 0;
  } catch {
    return 0;
  }
}
