"use client";

import { useEffect } from "react";

/**
 * Adds classes to <body> while the admin is mounted (default: `no-grain`, which turns off the
 * public film-grain overlay). Removes them again when leaving the admin.
 */
export function AdminBodyClass({ className = "no-grain" }: { className?: string }) {
  useEffect(() => {
    const classes = className.split(/\s+/).filter(Boolean);
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, [className]);
  return null;
}
