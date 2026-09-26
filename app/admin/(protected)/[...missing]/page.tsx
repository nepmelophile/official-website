import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

/*
 * Catch-all so unknown /admin/* URLs render the admin 404 inside the admin shell (instead of the
 * public site's 404). The protected layout has already checked the session; requireAdmin() is
 * repeated so this page is never reachable on its own.
 */
export default async function AdminMissingPage() {
  await requireAdmin();
  notFound();
}
