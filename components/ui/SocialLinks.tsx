import { cn } from "@/lib/utils";
import type { SocialLink } from "@/types/content";
import { SocialIcon, socialPlatformLabel } from "./SocialIcon";

export interface SocialLinksProps {
  links: SocialLink[] | null | undefined;
  /** Whose profiles these are, for accessible names ("Melophile on Instagram"). */
  owner?: string;
  /** icon = round icon buttons (default); label = icon + platform name rows/pills. */
  variant?: "icon" | "label";
  size?: "sm" | "md";
  className?: string;
  /** aria-label for the list (default "Social links"). */
  label?: string;
}

/** Outbound social/profile links with per-platform icons. Renders nothing when empty. */
export function SocialLinks({
  links,
  owner,
  variant = "icon",
  size = "md",
  className,
  label = "Social links",
}: SocialLinksProps) {
  const items = (links ?? []).filter((l) => /^https?:\/\//i.test(l.url));
  if (items.length === 0) return null;

  return (
    <ul aria-label={label} className={cn("flex flex-wrap items-center", variant === "icon" ? "gap-2" : "gap-2.5", className)}>
      {items.map((link, i) => {
        const name = socialPlatformLabel(link.platform);
        const accessibleName = owner ? `${owner} on ${name}` : name;
        return (
          <li key={`${link.platform}-${i}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={variant === "icon" ? `${accessibleName} (opens in a new tab)` : undefined}
              title={variant === "icon" ? name : undefined}
              className={cn(
                "group inline-flex items-center justify-center border border-line text-fg-muted transition-[color,border-color,background-color] duration-150 hover:border-fg hover:text-fg",
                variant === "icon"
                  ? cn("rounded-pill", size === "sm" ? "size-10" : "size-11")
                  : cn(
                      "min-h-11 gap-2 rounded-pill pr-4 pl-3 font-mono text-xs uppercase tracking-[0.12em]",
                      size === "sm" && "min-h-10",
                    ),
              )}
            >
              <SocialIcon platform={link.platform} size={size === "sm" ? 16 : 18} />
              {variant === "label" ? (
                <>
                  <span>{name}</span>
                  <span className="sr-only">{owner ? ` — ${owner}` : ""} (opens in a new tab)</span>
                </>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
