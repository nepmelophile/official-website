import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeStatus = "published" | "draft" | "active" | "inactive" | "new" | "read" | "archived" | "featured" | "override";

const STYLES: Record<BadgeStatus, { label: string; className: string; dot?: string }> = {
  published: { label: "Published", className: "border-success/40 text-success", dot: "bg-success" },
  active: { label: "Active", className: "border-success/40 text-success", dot: "bg-success" },
  draft: { label: "Draft", className: "border-line-strong text-fg-subtle", dot: "bg-ink-400" },
  inactive: { label: "Inactive", className: "border-line text-fg-subtle", dot: "bg-ink-500" },
  new: { label: "New", className: "border-accent/40 text-vermilion-300", dot: "bg-vermilion-500" },
  read: { label: "Read", className: "border-line-strong text-fg-muted" },
  archived: { label: "Archived", className: "border-line text-fg-subtle" },
  featured: { label: "Featured", className: "border-highlight/40 text-highlight" },
  override: { label: "Manual", className: "border-info/40 text-info" },
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  /** Override the default label. */
  children?: ReactNode;
  className?: string;
}

/** Mono status pill (published / draft / active / inactive / new / read / archived / featured / override). */
export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] whitespace-nowrap",
        style.className,
        className,
      )}
    >
      {style.dot ? <span aria-hidden className={cn("size-1.5 rounded-pill", style.dot)} /> : null}
      {children ?? style.label}
    </span>
  );
}

/** Convenience: boolean active flag → Active / Inactive badge. */
export function ActiveBadge({ active, className }: { active: boolean; className?: string }) {
  return <StatusBadge status={active ? "active" : "inactive"} className={className} />;
}
