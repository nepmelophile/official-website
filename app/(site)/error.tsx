"use client";

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

interface SiteErrorProps {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the failed segment (Next 16.3+). */
  retry: () => void;
}

/**
 * Error boundary for public pages. Renders inside the (site) layout, so the header and
 * footer stay usable. Shows the error digest (never the message) so a report can be matched
 * to the server logs.
 */
export default function SiteError({ error, retry }: SiteErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error(error);
    // Move focus to the message so keyboard and screen-reader users land on it.
    headingRef.current?.focus();
  }, [error]);

  return (
    <section aria-labelledby="site-error-title" className="bg-glow bg-bg">
      <Container size="reading" className="py-20 md:py-28 lg:py-32">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-danger" />
          Something went wrong
        </p>
        <h1
          ref={headingRef}
          id="site-error-title"
          tabIndex={-1}
          className="mt-6 font-display text-display-lg font-extrabold text-fg [font-stretch:88%] focus:outline-none [&_em]:font-serif [&_em]:font-normal [&_em]:text-highlight [&_em]:italic [&_em]:[font-stretch:100%]"
        >
          We hit a <em>wrong note</em>.
        </h1>
        <p className="mt-6 max-w-prose text-lg/relaxed text-fg-muted">
          This page could not be loaded just now. It is usually temporary — try again, or head back to the home
          page.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={() => retry()}
            leadingIcon={<RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />}
          >
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to home
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="mt-12 border-t border-line pt-6 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Reference <span className="text-fg-muted normal-case tracking-normal select-all">{error.digest}</span>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
