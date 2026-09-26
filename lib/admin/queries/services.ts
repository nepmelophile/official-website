import "server-only";
import { toObjectId } from "@/lib/admin/actions";
import { searchRegex } from "@/lib/admin/list";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeService } from "@/lib/serialize";
import { Service, type ServiceLean } from "@/models/Service";
import type { ServiceDTO } from "@/types/content";

/*
 * Admin read helpers for Services. Call only after requireAdmin(). Unlike lib/queries/services.ts
 * these include inactive services.
 */

export type ServiceActiveFilter = "" | "active" | "inactive";

export interface AdminServiceList {
  items: ServiceDTO[];
  /** Human-readable load problem (the list is then empty). */
  error?: string;
}

/** Every service (active and inactive) in public display order, filtered by name and status. */
export async function listAdminServices({
  q = "",
  status = "",
}: { q?: string; status?: ServiceActiveFilter } = {}): Promise<AdminServiceList> {
  if (!isDbConfigured()) {
    return { items: [], error: "The database is not configured (MONGODB_URI is missing)." };
  }
  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (q) filter.$or = [{ name: searchRegex(q) }, { slug: searchRegex(q) }, { description: searchRegex(q) }];
    if (status) filter.active = status === "active" ? true : { $ne: true };
    const docs = await Service.find(filter).sort({ order: 1, name: 1 }).lean<ServiceLean[]>();
    return { items: docs.map(serializeService) };
  } catch (error) {
    console.error("[melophile admin] listAdminServices failed", error);
    return { items: [], error: "Could not load services — is the database reachable?" };
  }
}

/** One service by id (null for a malformed or unknown id). Throws when the DB is unavailable. */
export async function getAdminService(id: string): Promise<ServiceDTO | null> {
  const oid = toObjectId(id);
  if (!oid) return null;
  await connectToDatabase();
  const doc = await Service.findById(oid).lean<ServiceLean>();
  return doc ? serializeService(doc) : null;
}

/** Suggested `order` for a new service: one step after the current last one. */
export async function getNextServiceOrder(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    await connectToDatabase();
    const last = await Service.findOne({}, { order: 1 }).sort({ order: -1 }).lean<Pick<ServiceLean, "_id" | "order">>();
    return last ? (last.order ?? 0) + 1 : 0;
  } catch {
    return 0;
  }
}
