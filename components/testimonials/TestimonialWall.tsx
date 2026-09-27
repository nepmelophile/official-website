import { META } from "@/components/cards/card-styles";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { TestimonialDTO } from "@/types/content";
import { TestimonialSourceCite } from "./TestimonialSourceCite";

type WallTestimonial = Pick<TestimonialDTO, "id" | "name" | "designation" | "quote" | "image" | "source">;

export interface TestimonialWallProps {
  testimonials: WallTestimonial[];
  className?: string;
}

function WallItem({ testimonial }: { testimonial: WallTestimonial }) {
  const initial = testimonial.name.trim().charAt(0).toUpperCase() || "M";
  return (
    <figure className="m-0 rounded-lg border border-line bg-surface p-6 shadow-card md:p-8">
      <span aria-hidden="true" className="block font-serif text-6xl leading-[0.6] text-accent select-none">
        “
      </span>
      <blockquote className="m-0 mt-2 font-serif text-xl/snug text-fg italic md:text-2xl/snug">
        <p>{testimonial.quote}</p>
      </blockquote>
      <figcaption className="mt-8 flex items-start gap-4">
        <SmartImage
          image={testimonial.image}
          alt={testimonial.name}
          decorative
          monogram={initial}
          sizes="48px"
          className="size-12 shrink-0 rounded-pill border border-line"
        />
        <span className="min-w-0">
          <span className="block font-semibold text-fg">{testimonial.name}</span>
          {testimonial.designation ? (
            <span className={cn(META, "mt-0.5 block text-[0.6875rem] text-fg-muted")}>{testimonial.designation}</span>
          ) : null}
          <TestimonialSourceCite source={testimonial.source} className="mt-2" />
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Masonry wall of quote cards (CSS columns, so cards keep their natural height). DOM order runs
 * down each column in turn, which is also the visual reading order, so `order` is preserved
 * for keyboard and screen-reader users.
 */
export function TestimonialWall({ testimonials, className }: TestimonialWallProps) {
  if (testimonials.length === 0) return null;
  return (
    <ul className={cn("columns-1 gap-6 md:columns-2 xl:columns-3", className)}>
      {testimonials.map((testimonial) => (
        <li key={testimonial.id} className="mb-6 break-inside-avoid">
          <WallItem testimonial={testimonial} />
        </li>
      ))}
    </ul>
  );
}
