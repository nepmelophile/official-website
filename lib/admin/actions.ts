import "server-only";
import { isValidObjectId, Types } from "mongoose";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { assertAdminForAction, UnauthorizedError, type AdminSession } from "@/lib/auth";
import { connectToDatabase, DbUnavailableError } from "@/lib/db";
import type { ActionFailure, ActionFieldErrors, ActionResult, ActionSuccess } from "./types";

/*
 * Shared helpers for admin CRUD server actions. Usage (in a 'use server' actions.ts):
 *
 *   export async function updateService(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
 *     return withAdmin(async () => {
 *       const parsed = parseInput(serviceSchema, input);
 *       if (!parsed.ok) return parsed;
 *       const doc = await Service.findByIdAndUpdate(toObjectIdOrThrow(id), parsed.data, { returnDocument: "after", runValidators: true });
 *       if (!doc) return fail("Service not found");
 *       revalidateServices();
 *       return ok({ id }, "Service saved");
 *     });
 *   }
 *
 * See docs/admin-kit.md for the full pattern.
 */

export type { ActionFailure, ActionFieldErrors, ActionResult, ActionSuccess } from "./types";
export { firstFieldError, hasFieldErrorUnder } from "./types";

/* ------------------------------------------------------------------ */
/* Result constructors                                                 */
/* ------------------------------------------------------------------ */

export function ok(): ActionSuccess<undefined>;
export function ok<T>(data: T, message?: string): ActionSuccess<T>;
export function ok<T>(data?: T, message?: string): ActionSuccess<T> {
  const result: ActionSuccess<T> = { ok: true };
  if (data !== undefined) result.data = data;
  if (message) result.message = message;
  return result;
}

export function fail(error: string, fieldErrors?: ActionFieldErrors): ActionFailure {
  return fieldErrors && Object.keys(fieldErrors).length > 0 ? { ok: false, error, fieldErrors } : { ok: false, error };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** ZodError → { "path.to.field": [messages] } ("_form" for root-level issues). */
export function zodFieldErrors(error: z.ZodError): ActionFieldErrors {
  const out: ActionFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export type ParseResult<T> = { ok: true; data: T } | ActionFailure;

/**
 * Validates a plain-object action input with a lib/validators schema.
 * On failure returns an ActionFailure you can `return` straight from the action.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): ParseResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors = zodFieldErrors(result.error);
  const count = Object.keys(fieldErrors).length;
  return fail(count === 1 ? "Please fix the highlighted field." : `Please fix the ${count} highlighted fields.`, fieldErrors);
}

/* ------------------------------------------------------------------ */
/* Mongo error mapping                                                 */
/* ------------------------------------------------------------------ */

interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
}

export function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}

/**
 * E11000 duplicate key → friendly failure on the offending field, e.g.
 * { error: "That slug is already in use.", fieldErrors: { slug: ["This slug already exists — choose another."] } }.
 * Returns null for any other error.
 */
export function duplicateKeyFailure(error: unknown): ActionFailure | null {
  if (!isDuplicateKeyError(error)) return null;
  const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0] ?? "slug";
  const value = error.keyValue?.[field];
  const shown = typeof value === "string" ? ` “${value}”` : "";
  const label = field === "slug" ? "slug" : field;
  return fail(`That ${label} is already in use.`, {
    [field]: [`The ${label}${shown} already exists — choose another.`],
  });
}

interface MongooseValidationErrorLike {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

function isMongooseValidationError(error: unknown): error is MongooseValidationErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "ValidationError" &&
    typeof (error as { errors?: unknown }).errors === "object"
  );
}

/** Maps any thrown error to a user-facing failure (never leaks internals). */
export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof UnauthorizedError) return fail(error.message);
  const duplicate = duplicateKeyFailure(error);
  if (duplicate) return duplicate;
  if (isMongooseValidationError(error)) {
    const fieldErrors: ActionFieldErrors = {};
    for (const [path, detail] of Object.entries(error.errors)) fieldErrors[path] = [detail.message];
    return fail("Some fields are invalid.", fieldErrors);
  }
  if (typeof error === "object" && error !== null && (error as { name?: unknown }).name === "CastError") {
    return fail("Invalid id or value.");
  }
  if (error instanceof DbUnavailableError) {
    return fail("The database is unreachable right now. Please try again in a moment.");
  }
  if (error instanceof Error && /MONGODB_URI/.test(error.message)) {
    return fail("The database is not configured (MONGODB_URI is missing).");
  }
  if (
    error instanceof Error &&
    /(ECONNREFUSED|ENOTFOUND|Server selection timed out|MongoNetworkError|MongooseServerSelectionError)/i.test(
      `${error.name} ${error.message}`,
    )
  ) {
    return fail("The database is unreachable right now. Please try again in a moment.");
  }
  return fail("Something went wrong while saving. Please try again.");
}

/* ------------------------------------------------------------------ */
/* The wrapper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Runs an admin server action body:
 *   1. assertAdminForAction() — rejects with { ok:false } when signed out (never redirects),
 *   2. connectToDatabase(),
 *   3. runs `fn(session)`, converting thrown errors (zod, E11000, validation, DB down) to
 *      { ok:false, error, fieldErrors? }. Next.js control-flow errors (redirect(), notFound())
 *      are re-thrown so they still work inside `fn`.
 */
export async function withAdmin<T = undefined>(
  fn: (session: AdminSession) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    const session = await assertAdminForAction();
    await connectToDatabase();
    return await fn(session);
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof UnauthorizedError)) console.error("[melophile admin action]", error);
    return toActionFailure(error);
  }
}

/* ------------------------------------------------------------------ */
/* Update documents                                                    */
/* ------------------------------------------------------------------ */

export interface MongoUpdate<T> {
  $set: Partial<T>;
  $unset?: Record<string, "">;
}

/**
 * Builds a `{ $set, $unset }` update from validated data. Mongo/Mongoose silently IGNORE
 * `undefined` in an update, so a cleared optional field (author, metaTitle, coverImage…) would
 * otherwise keep its old value. List those optional keys in `optionalKeys`: when their value is
 * undefined / null / "" they are $unset instead.
 *
 *   await Article.findByIdAndUpdate(oid, toMongoUpdate(parsed.data, ["author", "metaTitle", "metaDescription"]),
 *     { returnDocument: "after", runValidators: true });
 */
export function toMongoUpdate<T extends object>(data: T, optionalKeys: readonly (keyof T & string)[] = []): MongoUpdate<T> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};
  const optional = new Set<string>(optionalKeys);
  for (const [key, value] of Object.entries(data) as [string, unknown][]) {
    const blank = value === undefined || value === null || value === "";
    if (blank && optional.has(key)) $unset[key] = "";
    else if (value !== undefined) $set[key] = value;
  }
  for (const key of optionalKeys) {
    if (!(key in data)) $unset[key] = "";
  }
  const update: MongoUpdate<T> = { $set: $set as Partial<T> };
  if (Object.keys($unset).length) update.$unset = $unset;
  return update;
}

/* ------------------------------------------------------------------ */
/* ObjectId helpers                                                    */
/* ------------------------------------------------------------------ */

/** True for a 24-hex-char ObjectId string. */
export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value) && isValidObjectId(value);
}

/** string → ObjectId, or null when invalid. */
export function toObjectId(id: string | null | undefined): Types.ObjectId | null {
  return isObjectId(id) ? new Types.ObjectId(id) : null;
}

/** Thrown by toObjectIdOrThrow for malformed ids (mapped to "Invalid id" by withAdmin). */
export class InvalidIdError extends Error {
  constructor() {
    super("Invalid id or value.");
    this.name = "CastError";
  }
}

/** string → ObjectId; throws (→ { ok:false, error:"Invalid id or value." } inside withAdmin) when malformed. */
export function toObjectIdOrThrow(id: string): Types.ObjectId {
  const objectId = toObjectId(id);
  if (!objectId) throw new InvalidIdError();
  return objectId;
}

/** string[] → ObjectId[] (invalid ids dropped, order kept, de-duplicated). */
export function toObjectIds(ids: readonly (string | null | undefined)[] | null | undefined): Types.ObjectId[] {
  const seen = new Set<string>();
  const out: Types.ObjectId[] = [];
  for (const id of ids ?? []) {
    if (!isObjectId(id) || seen.has(id.toLowerCase())) continue;
    seen.add(id.toLowerCase());
    out.push(new Types.ObjectId(id));
  }
  return out;
}
