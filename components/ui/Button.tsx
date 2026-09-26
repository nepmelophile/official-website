import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn, isExternalUrl } from "@/lib/utils";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

export { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

/** Trailing icon: `arrow-up-right` (outbound / CTA), `arrow-right` ("view all"), or none. */
export type ButtonIcon = "arrow-up-right" | "arrow-right" | "none";

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

function TrailingIcon({ icon, size }: { icon: ButtonIcon; size: ButtonSize }) {
  if (icon === "none") return null;
  const common = {
    size: ICON_SIZE[size],
    strokeWidth: 1.75,
    "aria-hidden": true,
    className: "transition-transform duration-300 ease-out-expo",
  } as const;
  return icon === "arrow-up-right" ? (
    <ArrowUpRight {...common} className={cn(common.className, "group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5")} />
  ) : (
    <ArrowRight {...common} className={cn(common.className, "group-hover/button:translate-x-1")} />
  );
}

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  /** Optional leading icon node (e.g. a lucide icon with aria-hidden). */
  leadingIcon?: ReactNode;
  /** Trailing arrow; defaults to none. */
  icon?: ButtonIcon;
}

export interface ButtonProps extends SharedProps, ComponentPropsWithoutRef<"button"> {}

/** Pill `<button>` (defaults to `type="button"`). */
export function Button({
  variant,
  size = "md",
  block,
  leadingIcon,
  icon = "none",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, block, className })} {...rest}>
      {leadingIcon}
      {children}
      <TrailingIcon icon={icon} size={size} />
    </button>
  );
}

export interface ButtonLinkProps extends SharedProps, Omit<ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  /**
   * Open in a new tab. Defaults to true for absolute http(s) URLs (with
   * `rel="noopener noreferrer"`), false for internal paths.
   */
  external?: boolean;
}

/**
 * Pill link. Internal paths render `next/link`; absolute URLs render a plain `<a>` that opens in
 * a new tab (announced to screen readers) unless `external={false}`.
 */
export function ButtonLink({
  href,
  variant,
  size = "md",
  block,
  leadingIcon,
  icon,
  external,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const isExternal = external ?? isExternalUrl(href);
  const classes = buttonClasses({ variant, size, block, className });
  const trailing = icon ?? (isExternal ? "arrow-up-right" : "none");

  if (isExternal || !href.startsWith("/")) {
    return (
      <a
        href={href}
        className={classes}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {leadingIcon}
        {children}
        {isExternal ? <span className="sr-only"> (opens in a new tab)</span> : null}
        <TrailingIcon icon={trailing} size={size} />
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {leadingIcon}
      {children}
      <TrailingIcon icon={trailing} size={size} />
    </Link>
  );
}
