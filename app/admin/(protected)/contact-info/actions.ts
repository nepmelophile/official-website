"use server";

import { fail, ok, parseInput, toMongoUpdate, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateContact } from "@/lib/revalidate";
import { contactInfoSchema } from "@/lib/validators/contact-info";
import { ContactInfo } from "@/models/ContactInfo";
import { SINGLETON_KEY } from "@/models/shared";

/**
 * Upserts the ContactInfo singleton (key "default"). Contact details also appear in the
 * site-wide footer, so revalidateContact() refreshes every page under the root layout.
 */
export async function saveContactInfo(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(contactInfoSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await ContactInfo.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { ...toMongoUpdate(parsed.data, ["mapEmbedUrl", "officeHours"]), $setOnInsert: { key: SINGLETON_KEY } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    if (!doc) return fail("The contact details could not be saved. Please try again.");
    revalidateContact();
    return ok({ id: doc._id.toString() }, "Contact details saved");
  });
}
