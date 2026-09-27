"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TestimonialCard, type TestimonialCardData } from "@/components/cards/TestimonialCard";
import { cn } from "@/lib/utils";

export interface TestimonialSlide extends TestimonialCardData {
  id: string;
}

export interface TestimonialCarouselProps {
  testimonials: TestimonialSlide[];
  /** Heading block rendered in the left column (server-rendered SectionHeading). */
  heading: ReactNode;
  /** Accessible name for the carousel (default "Testimonials"). */
  label?: string;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const CONTROL =
  "inline-flex size-12 items-center justify-center rounded-pill border border-line-strong text-fg transition-[border-color,background-color,color] duration-150 hover:border-fg hover:bg-surface";

/**
 * Testimonials as a scroll-snap carousel: one large serif quote per view, previous/next
 * buttons (wrapping), a live "02 / 04" counter and progress ticks. Never autoplays. Without
 * JavaScript the track still scrolls natively; with it, the track is keyboard scrollable and
 * the active slide follows the scroll position.
 */
export function TestimonialCarousel({ testimonials, heading, label = "Testimonials", className }: TestimonialCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = testimonials.length;
  const multiple = count > 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !multiple || !("IntersectionObserver" in window)) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number(entry.target.getAttribute("data-slide")) || 0);
        }
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [multiple, count]);

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = ((target % count) + count) % count;
      const slide = track.querySelector<HTMLElement>(`[data-slide="${next}"]`);
      if (!slide) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: slide.offsetLeft, behavior: reduce ? "auto" : "smooth" });
      setActive(next);
    },
    [count],
  );

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("grid gap-10 lg:grid-cols-12 lg:gap-8", className)}
    >
      <div className="flex flex-col lg:col-span-4">
        {heading}
        {multiple ? (
          <div className="mt-10 flex items-center gap-4 lg:mt-auto lg:pt-12">
            <button type="button" onClick={() => goTo(active - 1)} className={CONTROL}>
              <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Previous testimonial</span>
            </button>
            <button type="button" onClick={() => goTo(active + 1)} className={CONTROL}>
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Next testimonial</span>
            </button>
            <p className="ml-2 font-mono text-sm tracking-[0.14em] text-fg-muted tabular-nums">
              <span className="text-highlight">{pad(active + 1)}</span>
              <span aria-hidden="true" className="px-1.5 text-line-strong">
                /
              </span>
              <span className="sr-only"> of </span>
              {pad(count)}
            </p>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              Testimonial {active + 1} of {count}: {testimonials[active]?.name}
            </p>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 lg:col-span-8">
        <div
          ref={trackRef}
          tabIndex={multiple ? 0 : undefined}
          aria-label={multiple ? `${label} — scroll or use the previous and next buttons` : undefined}
          className={cn(
            "relative flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth lg:pt-10",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight",
          )}
        >
          {testimonials.map((testimonial, i) => (
            <div
              key={testimonial.id}
              data-slide={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="w-full shrink-0 snap-start"
            >
              <TestimonialCard
                testimonial={testimonial}
                size="lg"
                framed={false}
                className="border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
              />
            </div>
          ))}
        </div>

        {multiple ? (
          <ol className="mt-10 flex gap-2 lg:pl-10" aria-label="Choose a testimonial">
            {testimonials.map((testimonial, i) => (
              <li key={testimonial.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === active ? "true" : undefined}
                  className="group flex h-11 w-full items-center"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-0.5 w-full rounded-pill transition-colors duration-300",
                      i === active ? "bg-accent" : "bg-line-strong group-hover:bg-fg-subtle",
                    )}
                  />
                  <span className="sr-only">
                    Testimonial {i + 1}: {testimonial.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
