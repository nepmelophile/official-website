import { cn } from "@/lib/utils";
import type { ImpactStat } from "@/types/content";
import { StatCounter } from "./StatCounter";

export interface StatGridProps {
  stats: ImpactStat[];
  className?: string;
}

/** Impact stats: 2 columns on mobile, 4 on desktop, hairlines between cells. */
export function StatGrid({ stats, className }: StatGridProps) {
  if (stats.length === 0) return null;
  return (
    <ul
      className={cn(
        "grid grid-cols-2 border-t border-line lg:grid-cols-4",
        "[&>li]:border-b [&>li]:border-line [&>li:nth-child(odd)]:border-r lg:[&>li]:border-r lg:[&>li:nth-child(4n)]:border-r-0 lg:[&>li:last-child]:border-r-0",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <li key={`${stat.label}-${i}`} className="px-4 py-8 md:px-6 md:py-10">
          <StatCounter value={stat.value} suffix={stat.suffix} label={stat.label} />
        </li>
      ))}
    </ul>
  );
}
