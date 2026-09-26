import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatGrid } from "@/components/ui/StatGrid";
import type { ImpactStat } from "@/types/content";

export interface ImpactSectionProps {
  stats: ImpactStat[];
  /** Section number shown in the kicker ("01 — Impact"). */
  index?: number;
}

/** Stats worth rendering (labelled, finite), capped at two desktop rows. */
export function visibleStats(stats: ImpactStat[]): ImpactStat[] {
  return stats.filter((stat) => stat.label.trim() && Number.isFinite(stat.value)).slice(0, 8);
}

/** "By the numbers": count-up impact stats from HomepageSettings. Hidden when empty. */
export function ImpactSection({ stats, index }: ImpactSectionProps) {
  const visible = visibleStats(stats);
  if (visible.length === 0) return null;

  return (
    <Section aria-labelledby="home-impact-title">
      <SectionHeading
        id="home-impact-title"
        index={index}
        eyebrow="Impact"
        title={
          <>
            Numbers that <em>move</em> the scene
          </>
        }
        description="Every figure is a musician heard, a story told or a room filled — proof that Nepali music travels further when it is backed properly."
      />
      <StatGrid stats={visible} className="mt-12 md:mt-16" />
    </Section>
  );
}
