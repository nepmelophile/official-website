import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Achievement } from "@/types/content";

export interface ArtistAchievementsProps {
  achievements: Achievement[];
  index: number;
  tone?: SectionTone;
}

/** Newest year first; undated milestones keep their editor order at the end. */
function sortAchievements(items: Achievement[]): Achievement[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ya = a.item.year ?? Number.NEGATIVE_INFINITY;
      const yb = b.item.year ?? Number.NEGATIVE_INFINITY;
      return ya === yb ? a.i - b.i : yb - ya;
    })
    .map(({ item }) => item);
}

/** Career milestones as a vertical timeline (year column + accent nodes on a hairline). */
export function ArtistAchievements({ achievements, index, tone = "alt" }: ArtistAchievementsProps) {
  const items = sortAchievements(achievements.filter((a) => a.title?.trim()));
  if (items.length === 0) return null;
  const ringTone = tone === "alt" || tone === "alt-glow" ? "ring-bg-alt" : "ring-bg";

  return (
    <Section tone={tone} aria-labelledby="artist-milestones-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <SectionHeading
            id="artist-milestones-title"
            index={index}
            eyebrow="Milestones"
            title={
              <>
                Career <em>highlights</em>
              </>
            }
            size="md"
          />
        </div>

        <ol className="lg:col-span-7 lg:col-start-6 lg:pt-6">
          {items.map((achievement, i) => (
            <li key={`${achievement.title}-${i}`} className="group grid grid-cols-[4.25rem_1fr] gap-x-5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
              <p className="pt-0.5 font-display text-2xl leading-none font-extrabold text-highlight tabular-nums sm:text-3xl">
                {achievement.year ? (
                  <time dateTime={String(achievement.year)}>{achievement.year}</time>
                ) : (
                  <>
                    <span aria-hidden="true" className="text-line-strong">
                      —
                    </span>
                    <span className="sr-only">Undated</span>
                  </>
                )}
              </p>
              <div className="relative border-l border-line pb-12 pl-6 group-last:border-transparent group-last:pb-0 sm:pl-8">
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 -left-[5px] size-2.5 rounded-pill bg-accent ring-4 ${ringTone}`}
                />
                <h3 className="font-display text-xl leading-tight font-bold text-fg md:text-2xl">{achievement.title}</h3>
                {achievement.description ? (
                  <p className="mt-2 max-w-prose text-fg-muted">{achievement.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
