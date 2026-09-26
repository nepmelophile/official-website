import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminBodyClass } from "@/components/admin/AdminBodyClass";

/* Shared by /admin/login and every protected admin page. */

export const metadata: Metadata = {
  title: {
    default: "Melophile Admin",
    template: "%s · Melophile Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-shell className="contents">
      <AdminBodyClass />
      {children}
    </div>
  );
}
