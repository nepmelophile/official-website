import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { TestimonialDTO } from "@/types/content";
import { META } from "./card-styles";

export type TestimonialCardData = Pick<TestimonialDTO, "name" | "designation" | "quote" | "image">;

export interface TestimonialCardProps {
  testimonial: TestimonialCardData;
  /** md = grid card (default); lg = single spotlight quote. */
  size?: "md" | "lg";
  /** Surface panel with border (default true). false = bare, for bands/carousels. */
  framed?: boolean;
  className?: string;
}

/** Serif-italic pull quote with accent (orchid) opening mark, avatar, name and designation. */
export function TestimonialCard({ testimonial, size = "md", framed = true, className }: TestimonialCardProps) {
  const initial = testimonial.name.trim().charAt(0).toUpperCase() || "M";
  return (
    <figure
      className={cn(
        "relative m-0 flex h-full flex-col",
        framed && "rounded-lg border border-line bg-surface p-6 shadow-card md:p-8",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block font-serif leading-[0.6] text-accent select-none",
          size === "lg" ? "text-[7rem] md:text-[9rem]" : "text-7xl",
        )}
      >
        “
      </span>
      <blockquote
        className={cn(
          "m-0 mt-2 font-serif italic text-fg",
          size === "lg" ? "text-3xl/tight md:text-5xl/tight" : "text-2xl/snug md:text-3xl/snug",
        )}
      >
        <p>{testimonial.quote}</p>
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-4 pt-8">
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
        </span>
      </figcaption>
    </figure>
  );
}
