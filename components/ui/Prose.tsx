import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, isExternalUrl } from "@/lib/utils";

export interface ProseProps {
  /** Markdown source. Raw HTML is never rendered. */
  children: string | null | undefined;
  /** `lg` (default) = article body (1.125rem on md+); `base` = compact (bios, service details). */
  size?: "base" | "lg";
  /** Extra wrapper classes. The wrapper is `max-w-reading` by default; pass `max-w-none` to widen. */
  className?: string;
}

const components: Components = {
  a({ href, children, node, ...props }) {
    void node;
    const external = typeof href === "string" && isExternalUrl(href);
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    );
  },
  img({ src, alt, title }) {
    if (typeof src !== "string" || !src) return null;
    return (
      <span className="not-prose my-8 block">
        {/* Markdown images have unknown dimensions, so next/image (which needs them) is not used. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-md border border-line bg-surface"
        />
        {title ? (
          <span className="mt-3 block font-mono text-xs uppercase tracking-[0.12em] text-fg-subtle">{title}</span>
        ) : null}
      </span>
    );
  },
  table({ children, node, ...props }) {
    void node;
    return (
      <div className="-mx-1 overflow-x-auto px-1">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

/**
 * Markdown renderer (react-markdown + GFM) styled with the `.prose-melophile` typography.
 * Raw HTML is skipped; unsafe URLs (javascript: etc.) are stripped by react-markdown.
 */
export function Prose({ children, size = "lg", className }: ProseProps) {
  if (!children?.trim()) return null;
  return (
    <div
      className={cn(
        "prose prose-invert prose-melophile max-w-reading",
        size === "lg" ? "prose-base md:prose-lg" : "prose-base",
        "prose-headings:font-extrabold prose-headings:tracking-tight prose-a:decoration-vermilion-500/60 prose-a:hover:decoration-vermilion-300",
        "prose-strong:font-semibold prose-code:before:content-none prose-code:after:content-none prose-img:rounded-md",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
