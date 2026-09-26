import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, isExternalUrl } from "@/lib/utils";
import type { ServiceDTO } from "@/types/content";
import { CARD_FOCUS, GROW_UNDERLINE, META, STRETCHED_LINK } from "./card-styles";

export type ServiceCardData = Pick<ServiceDTO, "name" | "slug" | "description" | "image">;

export interface ServiceCardProps {
  service: ServiceCardData;
  /** 1-based position, rendered as the big "01" index. */
  index: number;
  /**
   * Link target. Defaults to `/services#<slug>` (the services page gives each service that id).
   * Pass `service.formLink` to go straight to the enquiry form; external URLs open in a new tab.
   */
  href?: string;
  /** Link text shown at the bottom (default "Learn more"). */
  cta?: string;
  /** Show the service image as a strip at the top (default false — typographic card). */
  showImage?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
}

/** Numbered service card: surface panel, marigold mono index, title, description, arrow. */
export function ServiceCard({
  service,
  index,
  href,
  cta = "Learn more",
  showImage = false,
  headingLevel: Heading = "h3",
  className,
}: ServiceCardProps) {
  const target = href ?? `/services#${service.slug}`;
  const external = isExternalUrl(target);
  const linkBody = <span className={GROW_UNDERLINE}>{service.name}</span>;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card",
        "transition-[border-color,transform] duration-300 ease-out-expo hover:-translate-y-1 hover:border-line-strong",
        CARD_FOCUS,
        className,
      )}
    >
      {showImage ? (
        <SmartImage
          image={service.image}
          alt={service.name}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/9] border-b border-line"
          imgClassName="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <span
            aria-hidden="true"
            className="font-mono text-5xl leading-none font-medium tracking-[-0.04em] text-highlight md:text-6xl"
          >
            {String(index).padStart(2, "0")}
          </span>
          <ArrowUpRight
            size={24}
            strokeWidth={1.75}
            aria-hidden="true"
            className="text-fg-subtle transition-[color,transform] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-vermilion-300"
          />
        </div>
        <Heading className="mt-10 font-display text-display-sm font-bold text-fg md:mt-14">
          {external ? (
            <a href={target} target="_blank" rel="noopener noreferrer" className={STRETCHED_LINK}>
              {linkBody}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={target} className={STRETCHED_LINK}>
              {linkBody}
            </Link>
          )}
        </Heading>
        {service.description ? (
          <p className="mt-3 line-clamp-4 text-fg-muted">{service.description}</p>
        ) : null}
        <p aria-hidden="true" className={cn(META, "mt-auto pt-8 text-fg transition-colors group-hover:text-vermilion-300")}>
          {cta}
        </p>
      </div>
    </article>
  );
}
