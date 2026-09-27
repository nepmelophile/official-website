import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceDTO } from "@/types/content";

export interface ServicesIndexProps {
  services: Pick<ServiceDTO, "id" | "slug" | "name">[];
  className?: string;
}

/** "On this page" jump list: numbered service names linking to their anchors. */
export function ServicesIndex({ services, className }: ServicesIndexProps) {
  if (services.length === 0) return null;
  return (
    <nav aria-labelledby="services-index-title" className={className}>
      <h2 id="services-index-title" className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        On this page
      </h2>
      <ol className="mt-4 border-t border-line">
        {services.map((service, i) => (
          <li key={service.id} className="border-b border-line">
            <a
              href={`#${service.slug}`}
              className="group flex min-h-14 items-center gap-4 py-3 text-fg-muted transition-colors duration-150 hover:text-fg"
            >
              <span aria-hidden="true" className="w-6 shrink-0 font-mono text-xs text-highlight">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 font-display text-lg leading-snug font-semibold">{service.name}</span>
              <ArrowDown
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className={cn(
                  "shrink-0 text-fg-subtle transition-[transform,color] duration-300 ease-out-expo",
                  "group-hover:translate-y-0.5 group-hover:text-link",
                )}
              />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
