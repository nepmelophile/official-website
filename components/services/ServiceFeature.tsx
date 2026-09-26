import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Prose } from "@/components/ui/Prose";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, isExternalUrl } from "@/lib/utils";
import type { ServiceDTO } from "@/types/content";

export type ServiceFeatureData = Pick<ServiceDTO, "slug" | "name" | "description" | "details" | "image" | "formLink">;

export interface ServiceFeatureProps {
  service: ServiceFeatureData;
  /** 1-based position (rendered as the big "01"). */
  index: number;
  total: number;
  /** Image on the right on large screens (alternate rows for an editorial rhythm). */
  reverse?: boolean;
  /** Preload the image (first service only). */
  preload?: boolean;
}

/** Details longer than this collapse into a native disclosure so the page stays scannable. */
const COLLAPSE_AFTER_CHARS = 900;

const META = "font-mono text-xs uppercase tracking-[0.14em]";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Internal enquiry link for a service (prefills the contact form's service select). */
export function serviceContactHref(slug: string): string {
  return `/contact?service=${encodeURIComponent(slug)}`;
}

function ServiceDetails({ details, serviceName }: { details: string; serviceName: string }) {
  const text = details.trim();
  if (!text) return null;
  const body = <Prose size="base">{text}</Prose>;

  if (text.length > COLLAPSE_AFTER_CHARS) {
    return (
      <details className="group mt-8 border-y border-line">
        <summary
          className={cn(
            META,
            "flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 text-fg transition-colors hover:text-vermilion-300 [&::-webkit-details-marker]:hidden",
          )}
        >
          <span>
            What&rsquo;s included<span className="sr-only"> in {serviceName}</span>
          </span>
          <Plus
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 ease-out-expo group-open:rotate-45"
          />
        </summary>
        <div className="pb-6">{body}</div>
      </details>
    );
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <h3 className={cn(META, "text-fg-subtle")}>What&rsquo;s included</h3>
      <div className="mt-2">{body}</div>
    </div>
  );
}

/**
 * One service on /services: image + big marigold index + name, description, markdown details
 * and a CTA to its form link. `id={slug}` is the anchor ServiceCard links to (/services#slug).
 */
export function ServiceFeature({ service, index, total, reverse = false, preload = false }: ServiceFeatureProps) {
  const titleId = `service-${service.slug}-title`;
  const formLink = service.formLink?.trim() || serviceContactHref(service.slug);
  const external = isExternalUrl(formLink);

  return (
    <article id={service.slug} aria-labelledby={titleId} className="border-t border-line py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div
          className={cn(
            // Stretch the column so the sticky image can travel alongside long details.
            "lg:col-span-5 lg:row-start-1 lg:self-stretch",
            reverse ? "lg:col-start-8" : "lg:col-start-1",
          )}
        >
          <div className="lg:sticky lg:top-28">
            <SmartImage
              image={service.image}
              alt={service.name}
              sizes="(min-width: 1024px) 38vw, 100vw"
              preload={preload}
              className="aspect-[4/3] rounded-lg border border-line shadow-card"
            />
          </div>
        </div>

        <div
          className={cn(
            "min-w-0 lg:col-span-6 lg:row-start-1",
            reverse ? "lg:col-start-1" : "lg:col-start-7",
          )}
        >
          <div className="flex items-end justify-between gap-6">
            <span
              aria-hidden="true"
              className="font-mono text-6xl leading-none font-medium tracking-[-0.05em] text-highlight md:text-7xl"
            >
              {pad2(index)}
            </span>
            <span aria-hidden="true" className={cn(META, "pb-1 text-fg-subtle")}>
              {pad2(index)} / {pad2(total)}
            </span>
          </div>
          <h2
            id={titleId}
            className="mt-6 font-display text-display-lg font-extrabold break-words text-fg [font-stretch:88%]"
          >
            {service.name}
          </h2>
          {service.description ? (
            <p className="mt-6 max-w-prose text-lg/relaxed text-ink-200 md:text-xl/relaxed">{service.description}</p>
          ) : null}

          <ServiceDetails details={service.details ?? ""} serviceName={service.name} />

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href={formLink} icon={external ? "arrow-up-right" : "arrow-right"}>
              {external ? "Apply now" : "Enquire now"}
              <span className="sr-only"> about {service.name}</span>
            </ButtonLink>
            {external ? (
              <ButtonLink href={serviceContactHref(service.slug)} variant="ghost">
                Ask us a question
                <span className="sr-only"> about {service.name}</span>
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
