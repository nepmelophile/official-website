import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViewAllLinkProps {
  href: string;
  children: string;
  className?: string;
}

/**
 * Mono "View all →" link with a growing underline, matching the SectionHeading action. Use it
 * where the link can't sit in the heading row (e.g. under a narrow carousel heading).
 */
export function ViewAllLink({ href, children, className }: ViewAllLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.14em] text-fg transition-colors hover:text-secondary-soft",
        className,
      )}
    >
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-300 ease-out-expo group-hover:bg-size-[100%_1px]">
        {children}
      </span>
      <ArrowRight
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
      />
    </Link>
  );
}
