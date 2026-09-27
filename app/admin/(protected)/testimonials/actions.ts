"use server";

import type { Types } from "mongoose";
import { fail, ok, parseInput, toMongoUpdate, toObjectIdOrThrow, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateTestimonials } from "@/lib/revalidate";
import { testimonialFlagSchema, testimonialMoveSchema, testimonialSchema } from "@/lib/validators/testimonial";
import { Testimonial } from "@/models/Testimonial";

export async function createTestimonial(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(testimonialSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await Testimonial.create(parsed.data);
    revalidateTestimonials();
    return ok({ id: doc._id.toString() }, `Added ${doc.name}’s testimonial`);
  });
}

export async function updateTestimonial(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(testimonialSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await Testimonial.findByIdAndUpdate(toObjectIdOrThrow(id), toMongoUpdate(parsed.data, ["image", "source"]), {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) return fail("This testimonial no longer exists.");
    revalidateTestimonials();
    return ok({ id }, "Testimonial saved");
  });
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const doc = await Testimonial.findByIdAndDelete(toObjectIdOrThrow(id));
    if (!doc) return fail("This testimonial was already deleted.");
    revalidateTestimonials();
    return ok(undefined, `Deleted ${doc.name}’s testimonial`);
  });
}

/* ------------------------------------------------------------------ */
/* Inline list actions                                                 */
/* ------------------------------------------------------------------ */

interface OrderedDoc {
  _id: Types.ObjectId;
  order: number;
}

/** Every testimonial in display order (same sort as the admin list and the public pages). */
async function loadOrdered(): Promise<OrderedDoc[]> {
  return Testimonial.find({}, { order: 1 }).sort({ order: 1, createdAt: -1, _id: 1 }).lean<OrderedDoc[]>();
}

/** Swap a testimonial with its neighbour above / below, then renumber `order` 1…n (only changed ones are written). */
export async function moveTestimonial(id: string, direction: unknown): Promise<ActionResult<{ order: number }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(testimonialMoveSchema, direction);
    if (!parsed.ok) return parsed;

    const ordered = await loadOrdered();
    const index = ordered.findIndex((doc) => doc._id.equals(oid));
    if (index === -1) return fail("This testimonial no longer exists.");
    const target = parsed.data === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return ok({ order: index + 1 });

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const ops = ordered.flatMap((doc, i) =>
      doc.order === i + 1 ? [] : [{ updateOne: { filter: { _id: doc._id }, update: { $set: { order: i + 1 } } } }],
    );
    if (ops.length > 0) await Testimonial.bulkWrite(ops);
    revalidateTestimonials();
    return ok({ order: target + 1 }, `Moved to position ${target + 1}`);
  });
}

/** Show / hide a testimonial on the site without opening it. */
export async function setTestimonialActive(id: string, active: unknown): Promise<ActionResult<{ active: boolean }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(testimonialFlagSchema, active);
    if (!parsed.ok) return parsed;
    const doc = await Testimonial.findByIdAndUpdate(oid, { $set: { active: parsed.data } }, { returnDocument: "after" });
    if (!doc) return fail("This testimonial no longer exists.");
    revalidateTestimonials();
    return ok({ active: parsed.data }, parsed.data ? `${doc.name}’s testimonial is now shown` : `${doc.name}’s testimonial is now hidden`);
  });
}

/** Feature / unfeature a testimonial (featured quotes are shown large at the top of /testimonials). */
export async function setTestimonialFeatured(id: string, featured: unknown): Promise<ActionResult<{ featured: boolean }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(testimonialFlagSchema, featured);
    if (!parsed.ok) return parsed;
    const doc = await Testimonial.findByIdAndUpdate(oid, { $set: { featured: parsed.data } }, { returnDocument: "after" });
    if (!doc) return fail("This testimonial no longer exists.");
    revalidateTestimonials();
    return ok(
      { featured: parsed.data },
      parsed.data ? `Featured ${doc.name}’s testimonial` : `${doc.name}’s testimonial is no longer featured`,
    );
  });
}
