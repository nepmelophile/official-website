"use server";

import { fail, ok, parseInput, toMongoUpdate, toObjectIdOrThrow, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateServices } from "@/lib/revalidate";
import { serviceSchema } from "@/lib/validators/service";
import { Service } from "@/models/Service";

export async function createService(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(serviceSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await Service.create(parsed.data);
    revalidateServices();
    return ok({ id: doc._id.toString() }, `Created “${doc.name}”`);
  });
}

export async function updateService(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(serviceSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await Service.findByIdAndUpdate(toObjectIdOrThrow(id), toMongoUpdate(parsed.data), {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) return fail("This service no longer exists.");
    revalidateServices();
    return ok({ id }, "Service saved");
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const doc = await Service.findByIdAndDelete(toObjectIdOrThrow(id));
    if (!doc) return fail("This service was already deleted.");
    revalidateServices();
    return ok(undefined, `Deleted “${doc.name}”`);
  });
}
