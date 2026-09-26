"use server";

import { fail, ok, parseInput, toMongoUpdate, toObjectIdOrThrow, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateTestimonials } from "@/lib/revalidate";
import { testimonialSchema } from "@/lib/validators/testimonial";
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
    const doc = await Testimonial.findByIdAndUpdate(toObjectIdOrThrow(id), toMongoUpdate(parsed.data, ["image"]), {
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
