import { Container } from "@/components/ui/Container";

const shimmer = "animate-pulse rounded-md bg-surface";

/**
 * Skeleton for public listing pages (page heading + card grid). Used by the loading.tsx of the
 * dynamic listings only (/news, /artists): a loading boundary above the [slug] pages would
 * stream them, turning notFound()/redirect() into soft 200 responses.
 */
export function ListingSkeleton() {
  return (
    <div role="status" aria-live="polite" className="bg-glow">
      <span className="sr-only">Loading…</span>
      <Container className="py-16 md:py-24" aria-hidden="true">
        <div className="border-t border-line pt-6">
          <div className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
            <div className={`${shimmer} h-3 w-28 rounded-xs`} />
          </div>
          <div className={`${shimmer} mt-6 h-[clamp(2.75rem,1.5rem+5.2vw,6.5rem)] w-4/5 max-w-3xl`} />
          <div className={`${shimmer} mt-3 h-[clamp(2.75rem,1.5rem+5.2vw,6.5rem)] w-1/2 max-w-xl`} />
          <div className={`${shimmer} mt-8 h-4 w-full max-w-prose`} />
          <div className={`${shimmer} mt-3 h-4 w-2/3 max-w-md`} />
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ animationDelay: `${i * 90}ms` }} className="flex flex-col">
              <div className={`${shimmer} aspect-[16/10]`} style={{ animationDelay: `${i * 90}ms` }} />
              <div className={`${shimmer} mt-5 h-3 w-32 rounded-xs`} />
              <div className={`${shimmer} mt-4 h-7 w-11/12`} />
              <div className={`${shimmer} mt-2 h-7 w-3/5`} />
              <div className={`${shimmer} mt-4 h-4 w-full`} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
