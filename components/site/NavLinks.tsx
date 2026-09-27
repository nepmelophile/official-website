"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navCurrent, SITE_NAV, type NavItem } from "./nav";

/** Desktop nav links with active state (`aria-current` + bold + accent bar). */
export function NavLinks({ links = SITE_NAV, className }: { links?: readonly NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex items-center gap-1 lg:gap-2", className)}>
      {links.map((item) => {
        const current = navCurrent(pathname, item.href);
        const active = Boolean(current);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current}
              className={cn(
                "relative inline-flex min-h-11 items-center px-3 text-sm whitespace-nowrap transition-colors duration-150",
                "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-pill after:bg-accent after:transition-transform after:duration-300 after:ease-out-expo",
                active
                  ? "font-semibold text-fg after:scale-x-100"
                  : "text-fg-muted after:scale-x-0 hover:text-fg hover:after:scale-x-100 hover:after:bg-line-strong",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
