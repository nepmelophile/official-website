import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { getUnreadMessageCount } from "@/lib/admin/queries/dashboard";
import { requireAdmin } from "@/lib/auth";
import { getBrandAssets } from "@/lib/queries/brand";

/*
 * Shell for every signed-in admin page. requireAdmin() here is the page-level gate (proxy.ts is
 * only optimistic); server actions still check the session themselves via withAdmin().
 */
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const [unread, brand] = await Promise.all([getUnreadMessageCount(), getBrandAssets()]);

  return (
    <ToastProvider>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-pill focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg"
      >
        Skip to content
      </a>
      <div className="min-h-dvh bg-bg text-fg lg:flex">
        <AdminSidebar email={session.email} unreadMessages={unread} brand={brand} />
        <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[72rem]">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
