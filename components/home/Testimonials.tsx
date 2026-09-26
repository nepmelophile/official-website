import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TestimonialDTO } from "@/types/content";
import { TestimonialCarousel } from "./TestimonialCarousel";

export interface TestimonialsProps {
  testimonials: Pick<TestimonialDTO, "id" | "name" | "designation" | "quote" | "image">[];
  index?: number;
  tone?: SectionTone;
  /** Heading id (change it if the section is used twice on one page). */
  headingId?: string;
}

/**
 * "Word from the scene": testimonials carousel with the heading and controls on the left.
 * Reusable on /services. Hidden when there are no active testimonials.
 */
export function Testimonials({ testimonials, index, tone = "default", headingId = "testimonials-title" }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  const slides = testimonials.map(({ id, name, designation, quote, image }) => ({ id, name, designation, quote, image }));

  return (
    <Section tone={tone} aria-labelledby={headingId}>
      <TestimonialCarousel
        testimonials={slides}
        heading={
          <SectionHeading
            id={headingId}
            index={index}
            eyebrow="Testimonials"
            size="md"
            title={
              <>
                Word from the <em>scene</em>
              </>
            }
            description="Artists, bands and promoters on working with Melophile."
          />
        }
      />
    </Section>
  );
}
