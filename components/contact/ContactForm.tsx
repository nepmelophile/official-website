"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { flushSync } from "react-dom";
import { ArrowRight, ChevronDown, CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { submitContactMessage } from "@/app/(site)/contact/actions";
import { buttonClasses } from "@/components/ui/button-styles";
import { cn, slugify } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validators/common";
import {
  CONTACT_FIELDS,
  CONTACT_MAX_LENGTH,
  EMPTY_CONTACT_VALUES,
  HONEYPOT_FIELD,
  INITIAL_CONTACT_FORM_STATE,
  type ContactField,
  type ContactFormValues,
} from "./contact-form-state";
import { CONTROL, Field } from "./fields";

export interface ContactServiceOption {
  name: string;
  slug: string;
}

export interface ContactFormProps {
  /** Active services for the "Service" select (value = service name). */
  services: ContactServiceOption[];
  /** Offered as a fallback when a message can't be sent. */
  contactEmail?: string;
  /** id of the visible heading that names the form. */
  labelledBy?: string;
  className?: string;
}

const IDS: Record<ContactField, string> = {
  name: "contact-name",
  email: "contact-email",
  phone: "contact-phone",
  subject: "contact-subject",
  service: "contact-service",
  message: "contact-message",
};

const MESSAGE_MIN = 10;

/** Only our fields (drops React's progressive-enhancement `$ACTION_*` inputs). */
function toPayload(form: HTMLFormElement): FormData {
  const source = new FormData(form);
  const payload = new FormData();
  for (const key of [...CONTACT_FIELDS, HONEYPOT_FIELD]) {
    const value = source.get(key);
    payload.set(key, typeof value === "string" ? value : "");
  }
  return payload;
}

type Validator = (payload: FormData) => FieldErrors;

/*
 * The shared zod schema is loaded on demand (first focus inside the form, or submit) so the
 * ~100 KB zod runtime is not part of /contact's initial JavaScript.
 */
let loadedValidator: Validator | null = null;
let validatorPromise: Promise<Validator | null> | null = null;

function loadValidator(): Promise<Validator | null> {
  validatorPromise ??= import("./client-validate")
    .then((mod) => (loadedValidator = mod.validateContactPayload))
    .catch((error: unknown) => {
      // Chunk failed (offline, deploy switch): allow a retry later; the server still validates.
      console.warn("[melophile] contact form validator failed to load", error);
      validatorPromise = null;
      return null;
    });
  return validatorPromise;
}

function focusFirstInvalid(form: HTMLFormElement, errors: FieldErrors): void {
  const field = CONTACT_FIELDS.find((name) => errors[name]);
  if (!field) return;
  const element = form.elements.namedItem(field);
  if (element instanceof HTMLElement) element.focus();
}

/** Maps ?service=<slug or name> to the matching service name ("" when unknown). */
function matchService(services: ContactServiceOption[], param: string | null): string {
  if (!param) return "";
  const key = slugify(param) || param.trim().toLowerCase();
  return services.find((s) => s.slug === key || slugify(s.name) === key)?.name ?? "";
}

/**
 * Contact form: server action via useActionState, validated first in the browser with the
 * shared zod schema. Works without JS (native POST to the action); with JS the form is never
 * auto-reset, so typed values survive errors. Prefills service/subject from the query string.
 */
export function ContactForm(props: ContactFormProps) {
  // Bumping the key remounts the form with fresh action state ("Send another message").
  const [instance, setInstance] = useState(0);
  return <ContactFormBody key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

function ContactFormBody({
  services,
  contactEmail,
  labelledBy,
  className,
  onReset,
}: ContactFormProps & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitContactMessage, INITIAL_CONTACT_FORM_STATE);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const values: ContactFormValues = state.status === "error" ? state.values : EMPTY_CONTACT_VALUES;
  const [messageLength, setMessageLength] = useState(values.message.length);

  // Server-side field errors (rare: the client validates first) → focus the first one.
  useEffect(() => {
    if (state.status === "error" && formRef.current) focusFirstInvalid(formRef.current, state.fieldErrors);
  }, [state]);

  if (state.status === "success") {
    return <SuccessPanel firstName={state.firstName} onReset={onReset} className={className} />;
  }

  const serverErrors = state.status === "error" ? state.fieldErrors : {};
  const errors = clientErrors ?? serverErrors;
  const formMessage = state.status === "error" && clientErrors === null ? state.message : null;
  const offerEmail = state.status === "error" && Object.keys(state.fieldErrors).length === 0 && Boolean(contactEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Always handle submission here once hydrated (no automatic form reset, client validation).
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const payload = toPayload(form);
    const validate = loadedValidator ?? (await loadValidator());
    // Without the validator (chunk failed to load) the server action validates and reports errors.
    const nextErrors = validate ? validate(payload) : {};
    if (Object.keys(nextErrors).length > 0) {
      flushSync(() => setClientErrors(nextErrors));
      focusFirstInvalid(form, nextErrors);
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(payload));
  }

  /** Once a field shows an error, re-validate it as the visitor types so the message clears. */
  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)
    ) {
      return;
    }
    const field = target.name;
    if (!field || !(field in errors)) return;
    if (!loadedValidator) {
      void loadValidator();
      return;
    }
    const fieldError = loadedValidator(toPayload(event.currentTarget))[field];
    if (fieldError === errors[field]) return;
    const next = { ...errors };
    if (fieldError) next[field] = fieldError;
    else delete next[field];
    setClientErrors(next);
  }

  const groupProps: OptionalFieldsProps = { services, values, errors };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onFocus={() => void loadValidator()}
      noValidate
      aria-labelledby={labelledBy}
      aria-busy={pending || undefined}
      className={cn("grid gap-6", className)}
    >
      {formMessage ? (
        <div role="alert" className="flex gap-3 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm/relaxed text-fg">
          <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-danger" />
          <div>
            <p>{formMessage}</p>
            {offerEmail ? (
              <p className="mt-1 text-fg-muted">
                You can also email us at{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-fg underline decoration-accent underline-offset-4 hover:text-link"
                >
                  {contactEmail}
                </a>
                .
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={IDS.name} label="Your name" error={errors.name}>
          {(a11y) => (
            <input
              {...a11y}
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={CONTACT_MAX_LENGTH.name}
              defaultValue={values.name}
              placeholder="Asha Gurung"
              className={CONTROL}
            />
          )}
        </Field>
        <Field id={IDS.email} label="Email" error={errors.email}>
          {(a11y) => (
            <input
              {...a11y}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              required
              maxLength={CONTACT_MAX_LENGTH.email}
              defaultValue={values.email}
              placeholder="you@example.com"
              className={CONTROL}
            />
          )}
        </Field>
      </div>

      <Suspense fallback={<OptionalFields {...groupProps} defaultService={values.service} defaultSubject={values.subject} />}>
        <PrefilledOptionalFields {...groupProps} />
      </Suspense>

      <Field
        id={IDS.message}
        label="Message"
        error={errors.message}
        hint={`At least ${MESSAGE_MIN} characters. Tell us about your project, your timeline and where we can hear your music.`}
        aside={
          <span
            aria-hidden="true"
            className={cn(
              "font-mono text-[0.6875rem] tabular-nums",
              messageLength > CONTACT_MAX_LENGTH.message ? "text-danger" : "text-fg-subtle",
            )}
          >
            {messageLength.toLocaleString("en-US")} / {CONTACT_MAX_LENGTH.message.toLocaleString("en-US")}
          </span>
        }
      >
        {(a11y) => (
          <textarea
            {...a11y}
            name="message"
            required
            rows={7}
            maxLength={CONTACT_MAX_LENGTH.message}
            defaultValue={values.message}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessageLength(event.currentTarget.value.length)}
            placeholder="We’re releasing a five-track EP in March and need help with…"
            className={cn(CONTROL, "min-h-40 resize-y leading-relaxed")}
          />
        )}
      </Field>

      {/* Honeypot: hidden from people and assistive tech; bots that fill it are ignored. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-company">Company (leave this field empty)</label>
        <input id="contact-company" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs/relaxed text-fg-subtle">
          We only use your details to reply to you. No newsletters, no sharing.
        </p>
        <button
          type="submit"
          aria-disabled={pending || undefined}
          className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
        >
          {pending ? (
            <>
              <LoaderCircle size={18} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <Send
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="transition-transform duration-300 ease-out-expo group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
              />
            </>
          )}
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {pending ? "Sending your message…" : ""}
      </p>
    </form>
  );
}

interface OptionalFieldsProps {
  services: ContactServiceOption[];
  values: ContactFormValues;
  errors: FieldErrors;
}

/** Reads ?service= and ?subject= (client-only, so it sits inside a Suspense boundary). */
function PrefilledOptionalFields(props: OptionalFieldsProps) {
  const params = useSearchParams();
  const defaultService = props.values.service || matchService(props.services, params.get("service"));
  const defaultSubject =
    props.values.subject || (params.get("subject") ?? "").trim().slice(0, CONTACT_MAX_LENGTH.subject);
  return <OptionalFields {...props} defaultService={defaultService} defaultSubject={defaultSubject} />;
}

function OptionalFields({
  services,
  values,
  errors,
  defaultService,
  defaultSubject,
}: OptionalFieldsProps & { defaultService: string; defaultSubject: string }) {
  const knownService = services.some((s) => s.name === defaultService);
  return (
    <>
      <div className={cn("grid gap-6", services.length > 0 && "sm:grid-cols-2")}>
        <Field id={IDS.phone} label="Phone" optional error={errors.phone}>
          {(a11y) => (
            <input
              {...a11y}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={CONTACT_MAX_LENGTH.phone}
              defaultValue={values.phone}
              placeholder="+977 98XXXXXXXX"
              className={CONTROL}
            />
          )}
        </Field>
        {services.length > 0 ? (
          <Field id={IDS.service} label="Service" optional error={errors.service}>
            {(a11y) => (
              <div className="relative">
                <select
                  {...a11y}
                  name="service"
                  defaultValue={knownService ? defaultService : ""}
                  className={cn(CONTROL, "cursor-pointer appearance-none pr-11")}
                >
                  <option value="">Not sure yet / general enquiry</option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg-subtle"
                />
              </div>
            )}
          </Field>
        ) : null}
      </div>

      <Field id={IDS.subject} label="Subject" optional error={errors.subject}>
        {(a11y) => (
          <input
            {...a11y}
            name="subject"
            type="text"
            maxLength={CONTACT_MAX_LENGTH.subject}
            defaultValue={defaultSubject}
            placeholder="New single, press coverage, a gig…"
            className={CONTROL}
          />
        )}
      </Field>
    </>
  );
}

function SuccessPanel({
  firstName,
  onReset,
  className,
}: {
  firstName: string;
  onReset: () => void;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation so keyboard and screen-reader users land on it.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      aria-labelledby="contact-success-title"
      className={cn(
        "animate-fade-up rounded-lg border border-success/30 bg-success/5 p-6 outline-hidden md:p-8",
        className,
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-pill bg-success/15 text-success">
        <CircleCheck size={28} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 id="contact-success-title" className="mt-6 font-display text-display-sm font-bold text-fg">
        Thank you{firstName ? `, ${firstName}` : ""}. Message received.
      </h3>
      <p className="mt-3 max-w-prose text-fg-muted">
        It&rsquo;s in our team inbox now and we&rsquo;ll get back to you by email. In the meantime, catch up on
        what&rsquo;s new in Nepali music.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/news" className={buttonClasses({ variant: "secondary" })}>
          Read the latest news
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <button type="button" onClick={onReset} className={buttonClasses({ variant: "ghost" })}>
          Send another message
        </button>
      </div>
    </div>
  );
}
