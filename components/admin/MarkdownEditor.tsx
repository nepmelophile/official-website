"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote } from "lucide-react";
import { cn, readingTime, stripMarkdown } from "@/lib/utils";
import { Field, fieldDescribedBy } from "./Field";
import { inputClass } from "./styles";

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  /** Textarea rows (default 18). */
  rows?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
}

type Tab = "write" | "preview";

interface Format {
  label: string;
  icon: ReactNode;
  apply: (selected: string) => { text: string; selectStart: number; selectEnd: number };
  /** Line-level formats insert at the start of the line. */
  block?: boolean;
}

const iconProps = { "aria-hidden": true, className: "size-4", strokeWidth: 1.75 } as const;

function wrap(before: string, after: string, placeholder: string) {
  return (selected: string) => {
    const inner = selected || placeholder;
    return { text: `${before}${inner}${after}`, selectStart: before.length, selectEnd: before.length + inner.length };
  };
}

function prefixLines(prefix: (i: number) => string, placeholder: string) {
  return (selected: string) => {
    const lines = (selected || placeholder).split("\n");
    const text = lines.map((line, i) => `${prefix(i)}${line}`).join("\n");
    return { text, selectStart: 0, selectEnd: text.length };
  };
}

const FORMATS: Format[] = [
  { label: "Bold", icon: <Bold {...iconProps} />, apply: wrap("**", "**", "bold text") },
  { label: "Italic", icon: <Italic {...iconProps} />, apply: wrap("_", "_", "italic text") },
  { label: "Heading", icon: <Heading2 {...iconProps} />, apply: prefixLines(() => "## ", "Heading"), block: true },
  {
    label: "Link",
    icon: <LinkIcon {...iconProps} />,
    apply: (selected) => {
      const inner = selected || "link text";
      const text = `[${inner}](https://)`;
      const urlStart = inner.length + 3;
      return { text, selectStart: urlStart, selectEnd: urlStart + "https://".length };
    },
  },
  { label: "Quote", icon: <Quote {...iconProps} />, apply: prefixLines(() => "> ", "Quote"), block: true },
  { label: "Bulleted list", icon: <List {...iconProps} />, apply: prefixLines(() => "- ", "List item"), block: true },
  {
    label: "Numbered list",
    icon: <ListOrdered {...iconProps} />,
    apply: prefixLines((i) => `${i + 1}. `, "List item"),
    block: true,
  },
];

/**
 * Markdown textarea with a small formatting toolbar and a live Preview tab rendered with the
 * public prose styles (`prose prose-invert prose-melophile`, GFM enabled, raw HTML ignored).
 */
export function MarkdownEditor({
  value,
  onChange,
  label = "Body",
  hint,
  error,
  required,
  placeholder = "Write in Markdown…",
  rows = 18,
  disabled,
  id,
  className,
}: MarkdownEditorProps) {
  const generatedId = useId();
  const fieldId = id ?? `md${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [tab, setTab] = useState<Tab>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fullHint = hint ?? "Markdown: **bold**, _italic_, ## heading, [link](https://…), > quote, - list.";
  const words = value ? stripMarkdown(value).split(" ").filter(Boolean).length : 0;

  function applyFormat(format: Format) {
    const el = textareaRef.current;
    if (!el) return;
    let start = el.selectionStart;
    const end = el.selectionEnd;
    if (format.block) {
      // Extend to the start of the current line.
      start = value.lastIndexOf("\n", start - 1) + 1;
    }
    const selected = value.slice(start, end);
    const result = format.apply(selected);
    const needsLeadingBreak = format.block && start > 0 && value[start - 1] !== "\n";
    const insert = `${needsLeadingBreak ? "\n" : ""}${result.text}`;
    const offset = needsLeadingBreak ? 1 : 0;
    onChange(value.slice(0, start) + insert + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + offset + result.selectStart, start + offset + result.selectEnd);
    });
  }

  const tabId = (t: Tab) => `${fieldId}-tab-${t}`;
  const panelId = (t: Tab) => `${fieldId}-panel-${t}`;

  return (
    <Field
      id={fieldId}
      label={label}
      hint={fullHint}
      error={error}
      required={required}
      className={className}
      labelAside={
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle tabular-nums">
          {words.toLocaleString("en-US")} words · {value ? readingTime(value) : 0} min
        </span>
      }
    >
      <div
        className={cn(
          "overflow-hidden rounded-sm border bg-surface-raised",
          error ? "border-danger" : "border-line focus-within:border-accent",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg-alt px-1.5 py-1">
          <div role="tablist" aria-label="Editor mode" className="flex gap-1">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                id={tabId(t)}
                type="button"
                role="tab"
                aria-selected={tab === t}
                aria-controls={panelId(t)}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const nextTab = t === "write" ? "preview" : "write";
                    setTab(nextTab);
                    document.getElementById(tabId(nextTab))?.focus();
                  }
                }}
                className={cn(
                  "min-h-8 rounded-xs px-3 text-xs font-semibold transition-colors duration-150",
                  tab === t ? "bg-ink-700 text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {t === "write" ? "Write" : "Preview"}
              </button>
            ))}
          </div>
          {tab === "write" ? (
            <div role="toolbar" aria-label="Formatting" aria-controls={fieldId} className="flex flex-wrap gap-0.5">
              {FORMATS.map((format) => (
                <button
                  key={format.label}
                  type="button"
                  title={format.label}
                  aria-label={format.label}
                  disabled={disabled}
                  onClick={() => applyFormat(format)}
                  className="inline-flex size-8 items-center justify-center rounded-xs text-fg-muted transition-colors duration-150 hover:bg-ink-700 hover:text-fg disabled:opacity-40"
                >
                  {format.icon}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div id={panelId("write")} role="tabpanel" aria-labelledby={tabId("write")} hidden={tab !== "write"}>
          <textarea
            ref={textareaRef}
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={fieldDescribedBy(fieldId, fullHint, error)}
            className={cn(
              inputClass,
              "min-h-64 resize-y rounded-none border-0 bg-transparent font-mono text-[0.8125rem] leading-relaxed focus:ring-0",
            )}
          />
        </div>

        <div
          id={panelId("preview")}
          role="tabpanel"
          aria-labelledby={tabId("preview")}
          hidden={tab !== "preview"}
          tabIndex={0}
          className="min-h-64 px-5 py-4"
        >
          {tab === "preview" ? (
            value.trim() ? (
              <div className="prose prose-invert prose-melophile max-w-reading">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-fg-subtle">Nothing to preview yet.</p>
            )
          ) : null}
        </div>
      </div>
    </Field>
  );
}
