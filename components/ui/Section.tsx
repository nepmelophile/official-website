import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerSize } from "./Container";

const TONES = {
  default: "bg-bg",
  alt: "bg-bg-alt",
  glow: "bg-bg bg-glow",
  "alt-glow": "bg-bg-alt bg-glow",
} as const;

const SPACING = {
  default: "py-section",
  tight: "py-12 md:py-16",
  none: "",
} as const;

export type SectionTone = keyof typeof TONES;

export interface SectionProps extends Omit<ComponentPropsWithoutRef<"section">, "className"> {
  /** Background treatment (default `default`). */
  tone?: SectionTone;
  /** Vertical padding: default = fluid `py-section`, tight, or none. */
  spacing?: keyof typeof SPACING;
  /** Inner container width; pass `false` to render children full-bleed (no Container). */
  container?: ContainerSize | false;
  /** Adds hairlines on top/bottom (use for bands such as the trending strip). */
  bordered?: boolean;
  className?: string;
  containerClassName?: string;
  children?: ReactNode;
}

/**
 * Landing/listing section with consistent vertical rhythm. Give it `aria-labelledby`
 * pointing at the SectionHeading `id` so the landmark has a name.
 */
export function Section({
  tone = "default",
  spacing = "default",
  container = "content",
  bordered = false,
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cn("relative", TONES[tone], SPACING[spacing], bordered && "border-y border-line", className)}
      {...rest}
    >
      {container === false ? children : <Container size={container} className={containerClassName}>{children}</Container>}
    </section>
  );
}
