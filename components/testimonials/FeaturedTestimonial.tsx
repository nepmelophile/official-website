import { META } from "@/components/cards/card-styles";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { TestimonialDTO } from "@/types/content";
import { TestimonialSourceCite } from "./TestimonialSourceCite";

export interface FeaturedTestimonialProps {
  testimonial: Pick<TestimonialDTO, "name" | "designation" | "quote" | "image" | "source">;
  /** Mirror the layout (portrait on the right) for alternating spotlights. */
  reverse?: boolean;
  preload?: boolean;
  className?: string;
}

/** Long quotes step down a size so a featured spotlight never turns into a wall of type. */
function quoteSize(quote: string): string {
  if (quote.length > 320) return "text-2xl/snug md:text-3xl/snug lg:text-4xl/snug";
  if (quote.length > 160) return "text-3xl/tight md:text-4xl/tight lg:text-5xl/tight";
  return "text-3xl/tight md:text-5xl/tight lg:text-6xl/tight";
}

/**
 * A featured testimonial at poster size: portrait, an orchid opening mark, the quote in large
 * serif italic, then who said it (and where, when there is a source).
 */
export function FeaturedTestimonial({ testimonial, reverse = false, preload = false, className }: FeaturedTestimonialProps) {
  const initial = testimonial.name.trim().charAt(0).toUpperCase() || "M";
  return (
    <figure className={cn("m-0 grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12", className)}>
      <SmartImage
        image={testimonial.image}
        alt={testimonial.name}
        monogram={initial}
        sizes="(min-width: 1024px) 25vw, 96px"
        preload={preload}
        className={cn(
          "size-24 shrink-0 rounded-pill border border-line lg:col-span-4 lg:aspect-[4/5] lg:size-auto lg:w-full lg:rounded-xl",
          reverse && "lg:order-last",
        )}
      />
      <div className={cn("min-w-0 lg:col-span-8", reverse && "lg:col-start-1 lg:row-start-1")}>
        <span aria-hidden="true" className="block font-serif text-[7rem] leading-[0.55] text-accent select-none md:text-[10rem]">
          “
        </span>
        <blockquote className={cn("m-0 mt-2 font-serif text-balance text-fg italic", quoteSize(testimonial.quote))}>
          <p>{testimonial.quote}</p>
        </blockquote>
        <figcaption className="mt-10 border-t border-line pt-6">
          <span className="block font-display text-xl font-bold text-fg">{testimonial.name}</span>
          {testimonial.designation ? (
            <span className={cn(META, "mt-1 block text-[0.6875rem] text-fg-muted")}>{testimonial.designation}</span>
          ) : null}
          <TestimonialSourceCite source={testimonial.source} className="mt-3" />
        </figcaption>
      </div>
    </figure>
  );
}
