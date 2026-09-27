import type React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { cn, isExternalUrl } from "@/lib/utils";

export interface IntroTextProps {
  /** Short markdown or plain text (paragraphs, **bold**, *italic*, [links](…)). */
  children: string | null | undefined;
  className?: string;
}

/**
 * Inline formatting only: headings and list items render as plain paragraphs, and anything else
 * (images, tables, lists' wrappers…) is unwrapped to its text.
 */
const ALLOWED = ["p", "strong", "em", "a", "br", "code", "h1", "h2", "h3", "h4", "h5", "h6", "li"];

function Paragraph({ children }: { children?: React.ReactNode }) {
  return <p>{children}</p>;
}

const components: Components = {
  h1: Paragraph,
  h2: Paragraph,
  h3: Paragraph,
  h4: Paragraph,
  h5: Paragraph,
  h6: Paragraph,
  li: Paragraph,
  a({ href, children, node, ...props }) {
    void node;
    // react-markdown blanks unsafe URLs (javascript: …): keep the text, drop the link.
    if (!href) return <>{children}</>;
    const external = isExternalUrl(href);
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    );
  },
};

/**
 * Editor-written intro copy for page heroes. Markdown is optional (plain text renders as is).
 * Raw HTML is skipped and unsafe URLs are stripped by react-markdown.
 */
export function IntroText({ children, className }: IntroTextProps) {
  if (!children?.trim()) return null;
  return (
    <div
      className={cn(
        "space-y-4",
        "[&_a]:text-fg [&_a]:underline [&_a]:decoration-accent [&_a]:decoration-1 [&_a]:underline-offset-4 hover:[&_a]:decoration-2",
        "[&_strong]:font-semibold [&_strong]:text-fg [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-fg",
        className,
      )}
    >
      <ReactMarkdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
