"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Contact,
  House,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MicVocal,
  Newspaper,
  Quote,
  TrendingUp,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Match only the exact path (Dashboard). */
  exact?: boolean;
  badge?: "messages";
}

const iconProps = { "aria-hidden": true, className: "size-4 shrink-0", strokeWidth: 1.75 } as const;

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: <LayoutDashboard {...iconProps} />, exact: true }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/articles", label: "Articles", icon: <Newspaper {...iconProps} /> },
      { href: "/admin/artists", label: "Artists", icon: <MicVocal {...iconProps} /> },
      { href: "/admin/services", label: "Services", icon: <BriefcaseBusiness {...iconProps} /> },
      { href: "/admin/testimonials", label: "Testimonials", icon: <Quote {...iconProps} /> },
      { href: "/admin/trending", label: "Trending", icon: <TrendingUp {...iconProps} /> },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: <House {...iconProps} /> },
      { href: "/admin/contact-info", label: "Contact info", icon: <Contact {...iconProps} /> },
      { href: "/admin/messages", label: "Messages", icon: <Inbox {...iconProps} />, badge: "messages" },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface AdminSidebarProps {
  email: string;
  unreadMessages: number;
}

function Wordmark() {
  return (
    <Link href="/admin" className="group inline-flex items-baseline gap-2 rounded-xs">
      <span className="font-display text-lg font-extrabold tracking-tight text-fg">
        MELOPHILE<span className="text-vermilion-500">.</span>
      </span>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle group-hover:text-fg-muted">
        Admin
      </span>
    </Link>
  );
}

function NavContent({ pathname, unread, email, onNavigate }: { pathname: string; unread: number; email: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm transition-colors duration-150",
                        active
                          ? "bg-surface-raised font-semibold text-fg before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-pill before:bg-accent"
                          : "text-fg-muted hover:bg-surface hover:text-fg",
                      )}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge === "messages" && unread > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tabular-nums text-accent-fg">
                          {unread > 99 ? "99+" : unread}
                          <span className="sr-only"> unread</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
        >
          <ArrowUpRight {...iconProps} />
          View site
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-sm text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
          >
            <LogOut {...iconProps} />
            Log out
          </button>
        </form>
        <p className="truncate px-3 pt-2 font-mono text-[0.625rem] text-fg-subtle" title={email}>
          {email}
        </p>
      </div>
    </div>
  );
}

/**
 * Admin navigation: fixed sidebar on ≥ lg; top bar + slide-over drawer below lg
 * (Esc / backdrop / link click closes it; focus moves into the drawer and back to the toggle).
 */
export function AdminSidebar({ email, unreadMessages }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const toggle = toggleRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg-alt/95 px-4 backdrop-blur-md lg:hidden">
        <Wordmark />
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls={drawerId}
          className="relative inline-flex size-11 items-center justify-center rounded-sm text-fg hover:bg-surface"
        >
          <Menu aria-hidden className="size-5" strokeWidth={1.75} />
          <span className="sr-only">Open admin menu</span>
          {unreadMessages > 0 ? (
            <span aria-hidden className="absolute top-2 right-2 size-2 rounded-pill bg-vermilion-500" />
          ) : null}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-ink-950/70 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          id={drawerId}
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-bg-alt shadow-lift transition-transform duration-300 ease-out-expo",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <Wordmark />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-11 items-center justify-center rounded-sm text-fg-muted hover:bg-surface hover:text-fg"
            >
              <X aria-hidden className="size-5" strokeWidth={1.75} />
              <span className="sr-only">Close admin menu</span>
            </button>
          </div>
          <NavContent pathname={pathname} unread={unreadMessages} email={email} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg-alt lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Wordmark />
        </div>
        <NavContent pathname={pathname} unread={unreadMessages} email={email} />
      </aside>
    </>
  );
}
