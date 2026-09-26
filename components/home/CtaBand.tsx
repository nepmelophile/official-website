import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { VinylGrooves } from "./decor";

export interface CtaBandProps {
  /** Headline; wrap one phrase in <em> for the serif-italic marigold accent. */
  title?: ReactNode;
  description?: ReactNode;
  /** Primary action (default "Start a conversation" → /contact). */
  action?: { label: string; href: string };
  /** Team email shown as a secondary mailto link. */
  email?: string;
  /** Short mono line above the headline, e.g. office hours. */
  kicker?: string;
  headingId?: string;
  className?: string;
}

/**
 * Closing call-to-action band: poster-size headline over vinyl grooves and the brand glow,
 * a primary pill to /contact and an optional mailto. Reusable on /services.
 */
export function CtaBand({
  title = (
    <>
      Have a release coming up? <em>Let&rsquo;s talk.</em>
    </>
  ),
  description = "Singles, albums, tours or a first ever gig — tell us what you are working on and the team will help you plan how it reaches people.",
  action = { label: "Start a conversation", href: "/contact" },
  email,
  kicker = "Open for projects",
  headingId = "cta-band-title",
  className,
}: CtaBandProps) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn("bg-glow relative isolate overflow-hidden border-t border-line bg-bg py-section", className)}
    >
      <VinylGrooves className="absolute bottom-[-30rem] left-1/2 -z-10 size-[60rem] -translate-x-1/2 text-ink-800 md:bottom-[-34rem] md:size-[72rem] lg:left-auto lg:right-[-18rem] lg:translate-x-0" />

      <Container>
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
          <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
          {kicker}
        </p>
        <h2
          id={headingId}
          className={cn(
            "mt-6 max-w-[14ch] font-display text-display-xl font-extrabold tracking-[-0.025em] text-fg [font-stretch:88%]",
            "[&_em]:block [&_em]:font-serif [&_em]:font-normal [&_em]:tracking-[-0.02em] [&_em]:text-highlight [&_em]:italic [&_em]:[font-stretch:100%]",
          )}
        >
          {title}
        </h2>

        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-8">
          {description ? (
            <p className="max-w-prose text-lg/relaxed text-fg-muted lg:col-span-6">{description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:col-span-6 lg:justify-end">
            <ButtonLink href={action.href} size="lg" icon="arrow-up-right">
              {action.label}
            </ButtonLink>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="group inline-flex min-h-11 items-center gap-2 font-mono text-sm tracking-[0.04em] text-fg-muted transition-colors hover:text-fg"
              >
                <span className="text-fg-subtle">or email</span>
                <span className="break-all underline decoration-line-strong underline-offset-[6px] transition-[text-decoration-color] group-hover:decoration-vermilion-500">
                  {email}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
