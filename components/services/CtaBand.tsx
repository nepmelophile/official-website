import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Section, type SectionTone } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

interface CtaLink {
  label: string;
  href: string;
}

export interface CtaBandProps {
  /** Heading id (the section is labelled by it). */
  id: string;
  eyebrow?: string;
  /** Poster-size heading; wrap one word in <em> for the serif-italic accent. */
  title: ReactNode;
  description?: ReactNode;
  primary: CtaLink;
  secondary?: CtaLink;
  tone?: SectionTone;
  className?: string;
}

/** Vinyl-groove rings used as a quiet background motif. */
function Rings() {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className="size-full">
      {[196, 170, 146, 124, 104, 86, 70].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} stroke="currentColor" strokeWidth="1" />
      ))}
      <circle cx="200" cy="200" r="34" className="fill-accent/80" />
      <circle cx="200" cy="200" r="6" className="fill-bg-alt" />
    </svg>
  );
}

/** Closing call-to-action band: huge headline left, copy + pill buttons right. */
export function CtaBand({
  id,
  eyebrow,
  title,
  description,
  primary,
  secondary,
  tone = "alt-glow",
  className,
}: CtaBandProps) {
  return (
    <Section tone={tone} bordered aria-labelledby={id} className={cn("overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -bottom-44 size-[30rem] text-line opacity-70 md:-right-16 md:-bottom-56 md:size-[38rem]"
      >
        <Rings />
      </div>
      <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-8">
          {eyebrow ? (
            <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              <span aria-hidden="true" className="inline-block size-1.5 animate-pulse-dot rounded-pill bg-accent" />
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={id}
            className={cn(
              "font-display text-display-xl font-extrabold text-fg [font-stretch:85%]",
              "[&_em]:font-serif [&_em]:font-normal [&_em]:tracking-[-0.01em] [&_em]:text-brand-gradient [&_em]:italic [&_em]:[font-stretch:100%]",
            )}
          >
            {title}
          </h2>
        </div>
        <div className="flex flex-col items-start gap-7 lg:col-span-4">
          {description ? <div className="max-w-md text-base/relaxed text-fg-muted md:text-lg/relaxed">{description}</div> : null}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={primary.href} size="lg" icon="arrow-up-right">
              {primary.label}
            </ButtonLink>
            {secondary ? (
              <ButtonLink href={secondary.href} size="lg" variant="secondary">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
