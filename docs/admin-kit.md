# Admin kit — how to build an admin section

The admin lives at `/admin` and is built from four layers. Copy the worked example below for
every section so all of them behave the same way.

| Layer | Files |
|---|---|
| Auth | `lib/auth.ts` (server-only), `lib/admin/session.ts` (JWT, used by `proxy.ts` too), `proxy.ts` |
| Action helpers | `lib/admin/actions.ts` (server-only), `lib/admin/types.ts` (client-safe `ActionResult`) |
| List helpers | `lib/admin/list.ts` (`parseListParams`, `searchRegex`, `pageWindow`, `buildListHref`) |
| UI kit | `components/admin/*` (barrel: `@/components/admin`) |

Shell: `app/admin/layout.tsx` sets `robots: noindex` and turns off the film grain.
`app/admin/(protected)/layout.tsx` calls `requireAdmin()` and renders the sidebar and the
`ToastProvider`. `app/admin/actions.ts` holds `loginAction` and `logoutAction`.

## 1. Rules

1. **Routes**:
   - List: `app/admin/(protected)/<section>/page.tsx`
   - Create: `…/<section>/new/page.tsx`
   - Edit: `…/<section>/[id]/page.tsx`
   - Server actions: `…/<section>/actions.ts` (`"use server"`)
   - Client form: `…/<section>/<Entity>Form.tsx`

   The sidebar already links these sections: `articles`, `artists`, `services`, `testimonials`,
   `trending`, `homepage`, `contact-info` and `messages`, plus the page-settings editors
   `trending/settings` and `testimonials/settings` (the most specific matching link is the one
   highlighted).
2. **Every page** calls `await requireAdmin()` itself. The layout calls it too, but
   layouts and pages render in parallel, so don't rely on the layout alone. Every page also
   exports `metadata = { title: "…" }`. The admin template turns that into "Articles · Melophile
   Admin", and the admin layout already adds noindex.
3. **Every server action** returns `Promise<ActionResult<…>>` and wraps its whole body in
   `withAdmin(async () => { … })`. `withAdmin` does three things: it checks the session
   (without redirecting), connects to Mongo, and maps thrown errors to `{ ok:false }`. Those
   errors include zod errors, E11000 duplicate slugs, Mongoose validation, invalid ids and the DB
   being down. Validate with the schema from `lib/validators/<entity>.ts` via `parseInput()`.
4. **After every successful write**, call the matching `lib/revalidate.ts` helper, e.g.
   `revalidateArticles(slug)`. When a slug changes, call it for the old slug as well.
5. **Forms send plain JS objects, not FormData.** The client form holds its state in
   `useAdminForm()` and calls the server action with `values`. Server action arguments must be
   serializable: plain objects, arrays, strings, numbers, booleans and null. Don't pass `Date`
   objects; send dates as ISO strings. The zod schemas coerce them.
6. **Updates use `toMongoUpdate(data, optionalKeys)`.** Mongo ignores `undefined`, so a cleared
   optional field would otherwise keep its old value.
7. **Public pages are not touched here.** Admin pages read Mongo directly (drafts included) and
   map documents with the `serialize*` functions from `lib/serialize.ts`. Never pass a Mongoose
   document to a client component.
8. Admin pages must not export `revalidate`. They are dynamic because they read cookies.

## 2. Worked example: Services

### `app/admin/(protected)/services/actions.ts`

```ts
"use server";

import { fail, ok, parseInput, toMongoUpdate, toObjectIdOrThrow, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateServices } from "@/lib/revalidate";
import { serviceSchema } from "@/lib/validators/service";
import { Service } from "@/models/Service";

export async function createService(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(serviceSchema, input);
    if (!parsed.ok) return parsed; // { ok:false, error, fieldErrors }
    const doc = await Service.create(parsed.data);
    revalidateServices();
    return ok({ id: doc._id.toString() }, "Service created");
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
```

Articles and Artists also pass their optional keys, for example
`toMongoUpdate(parsed.data, ["author", "metaTitle", "metaDescription"])`, or
`["coverImage"]` for artists. Singletons such as Homepage and Contact info use an upsert:
`HomepageSettings.findOneAndUpdate({ key: SINGLETON_KEY }, { ...toMongoUpdate(data, ["heroImage"]), $setOnInsert: { key: SINGLETON_KEY } }, { upsert: true, returnDocument: "after", runValidators: true })`.

### `app/admin/(protected)/services/page.tsx` (list)

```tsx
import type { Metadata } from "next";
import { ActiveBadge, DataTable, DeleteButton, ListToolbar, PageHeader, type DataTableColumn } from "@/components/admin";
import { parseListParams, searchRegex, type RawSearchParams } from "@/lib/admin/list";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { serializeService } from "@/lib/serialize";
import { formatDate } from "@/lib/utils";
import { Service, type ServiceLean } from "@/models/Service";
import type { ServiceDTO } from "@/types/content";
import { deleteService } from "./actions";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const { q, status } = parseListParams(await searchParams, ["active", "inactive"]);

  let services: ServiceDTO[] = [];
  let loadError: string | undefined;
  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (q) filter.name = searchRegex(q);
    if (status) filter.active = status === "active";
    services = (await Service.find(filter).sort({ order: 1, name: 1 }).lean<ServiceLean[]>()).map(serializeService);
  } catch {
    loadError = "Could not load services — is the database reachable?";
  }

  const columns: DataTableColumn<ServiceDTO>[] = [
    { key: "name", header: "Name", primary: true, cell: (s) => s.name },
    { key: "order", header: "Order", align: "right", hideBelow: "sm", cell: (s) => s.order },
    { key: "active", header: "Status", cell: (s) => <ActiveBadge active={s.active} /> },
    { key: "updated", header: "Updated", hideBelow: "md", cell: (s) => formatDate(s.updatedAt, "medium") },
    {
      key: "actions", header: <span className="sr-only">Actions</span>, align: "right", interactive: true,
      cell: (s) => <DeleteButton action={deleteService} id={s.id} itemLabel={s.name} iconOnly size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader title="Services" count={services.length} action={{ href: "/admin/services/new", label: "New service" }} />
      <ListToolbar
        searchPlaceholder="Search services…"
        filters={[{ param: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] }]}
      />
      {loadError ? <p role="alert" className="mb-4 text-sm text-danger">{loadError}</p> : null}
      <DataTable
        caption="Services"
        rows={services}
        columns={columns}
        rowKey={(s) => s.id}
        rowHref={(s) => `/admin/services/${s.id}`}
        empty={q || status
          ? { title: "No matches", description: "Try a different search or filter." }
          : { title: "No services yet", action: { href: "/admin/services/new", label: "New service" } }}
      />
    </>
  );
}
```

For long lists such as articles, add pagination with `pageWindow(page)`, `countDocuments` and
`<Pagination page pageCount basePath params={{ q, status }} />`.

### `app/admin/(protected)/services/ServiceForm.tsx` (client)

```tsx
"use client";

import {
  FormSection, FormShell, ImageField, MarkdownEditor, NumberInput, SlugInput, TextArea, TextInput, Toggle, useAdminForm,
} from "@/components/admin";
import type { MediaRef, ServiceDTO } from "@/types/content";
import { createService, deleteService, updateService } from "./actions";

interface ServiceFormValues {
  name: string; slug: string; image: MediaRef; description: string; details: string;
  formLink: string; order: number | undefined; active: boolean;
}

function toValues(s?: ServiceDTO): ServiceFormValues {
  return {
    name: s?.name ?? "", slug: s?.slug ?? "", image: s?.image ?? { url: "" }, description: s?.description ?? "",
    details: s?.details ?? "", formLink: s?.formLink ?? "", order: s?.order ?? 0, active: s?.active ?? true,
  };
}

export function ServiceForm({ service }: { service?: ServiceDTO }) {
  const isNew = !service;
  const form = useAdminForm({
    initial: toValues(service),
    action: (values) => (service ? updateService(service.id, values) : createService(values)),
    // After create, go to the edit page. After update, stay on the page (router.refresh()).
    redirectTo: isNew ? (data) => (data ? `/admin/services/${data.id}` : undefined) : undefined,
  });
  const { values, setter, error } = form;

  return (
    <FormShell
      title={isNew ? "New service" : values.name || "Untitled service"}
      backHref="/admin/services"
      backLabel="Services"
      form={form}
      submitLabel={isNew ? "Create service" : "Save changes"}
      deleteProps={service ? { action: deleteService, id: service.id, itemLabel: service.name, redirectTo: "/admin/services" } : undefined}
      aside={
        <>
          <FormSection title="Visibility">
            <Toggle label="Active" description="Shown on /services" checked={values.active} onChange={setter("active")} />
            <NumberInput label="Order" hint="Lower numbers come first" compact value={values.order} onChange={setter("order")} error={error("order")} />
          </FormSection>
          <FormSection title="Image">
            <ImageField value={values.image} onChange={setter("image")} folder="/melophile/services"
              error={error("image.url") ?? error("image")} altError={error("image.alt")} required />
          </FormSection>
        </>
      }
    >
      <FormSection title="Details">
        <TextInput label="Name" required value={values.name} onChange={setter("name")} error={error("name")} maxLength={120} showCount />
        <SlugInput source={values.name} prefix="/services#" value={values.slug} onChange={setter("slug")} error={error("slug")} />
        <TextArea label="Short description" required rows={3} value={values.description} onChange={setter("description")} error={error("description")} maxLength={400} showCount />
        <TextInput label="Form link" type="url" required hint="Google Form URL or an internal path like /contact?service=mixing"
          value={values.formLink} onChange={setter("formLink")} error={error("formLink")} />
        <MarkdownEditor label="Details" value={values.details} onChange={setter("details")} error={error("details")} />
      </FormSection>
    </FormShell>
  );
}
```

### `app/admin/(protected)/services/new/page.tsx`

```tsx
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "New service" };

export default async function NewServicePage() {
  await requireAdmin();
  return <ServiceForm />;
}
```

### `app/admin/(protected)/services/[id]/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toObjectId } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { serializeService } from "@/lib/serialize";
import { Service, type ServiceLean } from "@/models/Service";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const oid = toObjectId(id);
  if (!oid) notFound();
  await connectToDatabase();
  const doc = await Service.findById(oid).lean<ServiceLean>();
  if (!doc) notFound();
  const service = serializeService(doc);
  // key: remount with fresh server data after a save (the server may normalize values).
  return <ServiceForm key={service.updatedAt} service={service} />;
}
```

Option lists for pickers are built on the server and passed to the form as props, for example:

```ts
const articles = await Article.find({}, { title: 1, status: 1, publishedAt: 1 }).sort({ publishedAt: -1 }).lean();
const articleOptions: RefOption[] = articles.map((a) => ({
  id: a._id.toString(),
  label: a.title,
  description: `${a.status} · ${formatDate(a.publishedAt, "medium")}`,
}));
```

## 3. API reference

### Auth (`lib/auth.ts`, server-only)

| Export | Use |
|---|---|
| `requireAdmin(nextPath?) → Promise<AdminSession>` | Pages, layouts and server components. Redirects to `/admin/login?next=…` when signed out. |
| `assertAdminForAction() → Promise<AdminSession>` | Throws `UnauthorizedError` and never redirects. `withAdmin` calls it for you. |
| `getSession() → Promise<AdminSession \| null>`, `isAdmin()` | Route handlers (return 401 JSON yourself). |
| `createSession(email)`, `destroySession()` | Only in the login and logout actions. |
| `verifyCredentials(email, password) → boolean` | Constant time (sha256 + timingSafeEqual). |
| `UnauthorizedError`, `ADMIN_PATH_HEADER`, `SESSION_COOKIE`, `type AdminSession {email, role, issuedAt, expiresAt}` | |

### Actions (`lib/admin/actions.ts`, server-only)

| Export | Use |
|---|---|
| `ActionResult<T>` | `{ ok:true; data?: T; message?: string } \| { ok:false; error: string; fieldErrors?: Record<string,string[]> }` |
| `withAdmin(fn: (session) => Promise<ActionResult<T>>)` | Checks auth, connects to the DB, runs `fn` and maps errors. `redirect()` and `notFound()` still work inside it. |
| `parseInput(schema, input)` | Returns `{ ok:true, data } \| ActionFailure`. Return the failure as is. |
| `ok(data?, message?)`, `fail(error, fieldErrors?)` | Result constructors. |
| `zodFieldErrors(zodError)`, `duplicateKeyFailure(err)`, `isDuplicateKeyError(err)`, `toActionFailure(err)` | Error mapping. E11000 on `slug` becomes `fieldErrors.slug`. |
| `toMongoUpdate(data, optionalKeys?)` | Returns `{ $set, $unset? }`. |
| `toObjectId(id)`, `toObjectIdOrThrow(id)`, `toObjectIds(ids)`, `isObjectId(v)` | ObjectId helpers. |

### Components (`@/components/admin`)

All inputs are controlled and take `value` and `onChange(value)`, not DOM events. Most of them
also accept `label`, `hint`, `error`, `required`, `optional`, `disabled`, `id` and `className`,
and wire up `aria-invalid` and `aria-describedby` themselves.

**Forms**

| Component | Key props |
|---|---|
| `useAdminForm({ initial, action, redirectTo?, successMessage?, onSuccess? })` | Returns `{ values, set, setter(key), update, errors, error(path), formError, pending, dirty, submit, reset, markSaved, setErrors }` |
| `FormShell` | `title, description?, backHref, backLabel?, form, submitLabel?, deleteProps?, aside?, headerActions?, meta?, guardUnsaved?` Includes a sticky save bar, Ctrl/⌘+S, and an unsaved-changes guard. |
| `FormSection` | `title, description?, actions?` A titled panel. |
| `Field` | `id, label, hint?, error?, required?, optional?, hideLabel?, labelAside?, as?: "label"\|"group"` For custom controls; use with `fieldDescribedBy(id, hint, error)`. |

**Inputs**

| Component | Key props |
|---|---|
| `TextInput` | `value, onChange(string), type?, placeholder?, maxLength?, showCount?, suggestions?` (a datalist) `inputProps?` |
| `TextArea` | `value, onChange, rows?, maxLength?, showCount?, mono?` |
| `NumberInput` | `value: number\|undefined, onChange(number\|undefined), min?, max?, step?, compact?` |
| `DateInput` | `value: ISO string, onChange(iso \| ""), mode?: "datetime"\|"date", showNow?` Edits in Nepal time (UTC+05:45). |
| `Select<V>` | `value, onChange(V \| ""), options: {value,label}[], placeholder?` (adds an empty option) |
| `Checkbox`, `Toggle` | `label, description?, checked, onChange(boolean)` `Toggle` is a `role="switch"`. |
| `StatusSelect` | `value: "draft"\|"published", onChange` A segmented control. |
| `SlugInput` | `value, onChange, source` (the title), `prefix?` Follows `slugify(source)` until it is edited by hand; "Regenerate" switches back to following. |
| `TagInput` | `value: string[], onChange, suggestions?, maxItems?, maxLength?` |
| `MarkdownEditor` | `value, onChange, rows?` Toolbar, Write and Preview tabs (same prose styles as the public site), word count and reading time. |
| `EmbedUrlInput` | Same props as `TextInput`. Shows the Spotify, YouTube or SoundCloud provider and a player preview. |

**Media**

| Component | Key props |
|---|---|
| `ImageField` | `value: MediaRef\|undefined, onChange(MediaRef)` (url `""` means removed) `error?` (url), `altError?, folder?, showAlt?, aspect?, maxSizeMb?` Paste-a-URL input, alt text, and ImageKit upload with progress, cancel and drag-and-drop. Upload is hidden when `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` is unset. |
| `MediaListField` | `value: ArtistMedia[], onChange, errorFor?` (pass `form.error`) `name?="media", folder?, maxItems?` |
| `MultiImageField` | `name, value: MediaRef[], onChange, errorFor?` |

**Lists and pickers**

| Component | Key props |
|---|---|
| `Repeater<T>` | `label, name, items, onChange, createItem, renderItem(item, row)` where row is `{update(patch), remove(), index, path}`. Also `itemTitle?, addLabel?, maxItems?, reorderable?, compact?, emptyText?` Error paths are `${row.path}.field`. |
| `SocialLinksField` | `value: SocialLink[], onChange, errorFor?, name?="socialLinks"` Detects the platform from a pasted URL. |
| `RefMultiSelect` | `options: RefOption[] {id,label,description?}, value: string[], onChange, maxItems?, excludeIds?, reorderable?` A searchable combobox with ordered picks. |
| `RefSelect` | `options, value, onChange(id \| ""), noneLabel?` A single reference. |

**Actions and feedback**

| Component | Key props |
|---|---|
| `DeleteButton` | `action` (the server action, called as `action(id)`), `id, itemLabel, redirectTo?, label?, description?, iconOnly?, variant?, size?` Confirms in a dialog, then shows a toast and refreshes or redirects. |
| `ConfirmDialog` | `open, title, description?, confirmLabel?, variant?, pending?, error?, onConfirm, onCancel` Built on the native `<dialog>`. |
| `useToast()` | Returns `{ toast({message, kind?, duration?}), success(msg), error(msg), info(msg), dismiss(id) }` |

**Page building blocks**

| Component | Key props |
|---|---|
| `PageHeader` | `title, description?, count?, action?: {href,label}, children?` (extra actions) Renders the `<h1>`. |
| `DataTable<T>` | `rows, columns: {key, header, cell(row), primary?, interactive?, align?, hideBelow?}[], rowKey, rowHref?, caption, empty?, rowClassName?` A server component, so `cell` functions are fine. |
| `ListToolbar` | `searchPlaceholder?, search?, filters?: {param,label,options,allLabel?}[]` Writes `?q=` (debounced) and filter params, and resets `?page`. |
| `Pagination` | `page, pageCount, basePath, params?, total?` |
| `StatusBadge`, `ActiveBadge` | `status: published\|draft\|active\|inactive\|new\|read\|archived\|featured\|override` / `active: boolean` |
| `EmptyState` | `title, description?, action?` |
| `Button`, `ButtonLink`, `buttonClass()` | `variant: primary\|secondary\|ghost\|danger, size: sm\|md, loading?, icon?` Buttons default to `type="button"`. |

**Style constants** (`components/admin/styles.ts`): `inputClass`, `labelClass`, `hintClass`,
`errorClass`, `metaClass`, `panelClass` and `iconButtonClass`.

## 4. Gotchas

- The server pages list above are server components. Don't pass inline arrow functions from
  them into client components. `DeleteButton` takes the server action reference and an `id` so
  it can be used from server-rendered tables.
- `useAdminForm` compares `JSON.stringify(values)` to decide `dirty`, so keep form state
  JSON-friendly: no `Date`s, Maps or class instances.
- Keep ordered id pickers (`featuredArticleIds`) in the order the editor chose. Public queries
  use `orderByIds`.
- Messages: `/admin/messages` filters on `status` (`new` | `read` | `archived`). Opening a
  message should mark it `read`, and every status change or delete should call
  `router.refresh()` (useAdminForm and DeleteButton already do) so the sidebar's unread badge
  updates. Reply is a `mailto:` link.
- ImageKit `fileId` is stored when an image is uploaded and cleared when the URL is edited by
  hand.
- Don't read non-component values exported by `"use client"` modules from server code. On the
  server they are client references, not their real values. This applies to
  `IMAGEKIT_UPLOAD_ENABLED`, `isoToNepalInput`, `nepalInputToIso`, `uploadToImageKit` and
  `useAdminForm`. The server-safe modules are `Button`, `buttonClass`, `Field`, `DataTable`,
  `PageHeader`, `Pagination`, `StatusBadge`, `EmptyState`, `FormSection` and `styles`.
- The dashboard links to `/admin/messages/<id>` (message detail) and
  `/admin/messages?status=new`, so the Messages section must provide both.
- Admin read queries live in `lib/admin/queries/<entity>.ts` (drafts included), next to
  `lib/admin/queries/dashboard.ts` (`getDashboardData`, `getUnreadMessageCount`). Public,
  published-only reads stay in `lib/queries/*`.
- Mongoose 9 deprecates `{ new: true }`; use `{ returnDocument: "after" }` in
  `findByIdAndUpdate` / `findOneAndUpdate`.
- Repeater error paths are stable: `objectList()` validates blank rows as `null` placeholders and
  removes them afterwards, so `embeds.2.url` always refers to the third row on screen. No
  client-side remapping is needed.
- `useAdminForm` moves focus to (and scrolls to) the first `[aria-invalid="true"]` control in
  `#admin-main` after a failed save. Give every input `aria-invalid` when it has an error (the
  kit inputs already do).
- `app/admin/(protected)/error.tsx` catches errors thrown by admin pages (e.g. the DB going down
  mid-edit) and `not-found.tsx` + the `[...missing]` catch-all render 404s inside the admin shell,
  so edit pages can simply call `notFound()` for unknown ids.
- Scrollable containers (`overflow-x-auto`) that hold `sr-only` text or `after:absolute` link
  overlays need `relative`, or those absolutely positioned descendants escape the clip and widen
  the page on phones (`DataTable` already does this).
