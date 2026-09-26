import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { HeroCta, HomepageSettingsDTO } from "@/types/content";
import { RecordSticker, VinylGrooves } from "./decor";
import { withAccent } from "./emphasis";

export interface HomeHeroProps {
  settings: Pick<HomepageSettingsDTO, "heroHeadline" | "heroSubcopy" | "heroImage" | "heroCtas">;
}

const CTA_VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "ghost"];
const META = "font-mono text-xs uppercase tracking-[0.14em]";

function HeroCtas({ ctas }: { ctas: HeroCta[] }) {
  const items = ctas.filter((cta) => cta.label.trim() && cta.href.trim()).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="Get started">
      {items.map((cta, i) => (
        <li key={`${cta.href}-${i}`}>
          <ButtonLink
            href={cta.href}
            variant={CTA_VARIANTS[i] ?? "ghost"}
            size="lg"
            icon={i === 0 ? "arrow-up-right" : i === 1 ? "arrow-right" : undefined}
          >
            {cta.label}
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Landing hero: a full-width poster headline (one serif-italic marigold accent), then an
 * asymmetric 5/7 row with the subcopy + CTAs and the optional hero image. Without an image
 * the copy shifts right and the record sticker takes the left column.
 */
export function HomeHero({ settings }: HomeHeroProps) {
  const { heroHeadline, heroSubcopy, heroImage, heroCtas } = settings;
  const hasImage = Boolean(heroImage?.url?.trim());

  return (
    <section aria-labelledby="home-hero-title" className="bg-glow relative isolate overflow-hidden border-b border-line bg-bg">
      <VinylGrooves className="absolute top-[-27rem] right-[-31rem] -z-10 size-[56rem] text-ink-800 md:top-[-22rem] md:right-[-18rem] md:size-[72rem]" />

      <Container className="relative pt-8 pb-14 md:pt-12 md:pb-20 lg:pb-24">
        <div className={cn(META, "flex animate-fade-up items-center justify-between gap-4 text-fg-subtle")}>
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
            Live from Kathmandu
          </p>
          <p className="hidden sm:block">News / Artists / Services</p>
        </div>

        <h1
          id="home-hero-title"
          className={cn(
            "mt-8 animate-fade-up font-display text-display-2xl font-extrabold tracking-[-0.02em] text-fg [font-stretch:86%] [animation-delay:80ms] md:mt-12",
            "max-w-[16ch] [&_em]:font-serif [&_em]:font-normal [&_em]:tracking-[-0.02em] [&_em]:text-highlight [&_em]:italic [&_em]:[font-stretch:100%]",
          )}
        >
          {withAccent(heroHeadline)}
        </h1>

        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-8">
          <div
            className={cn(
              "flex animate-fade-up flex-col [animation-delay:160ms]",
              hasImage ? "lg:col-span-5 lg:pt-4" : "lg:col-span-6 lg:col-start-7",
            )}
          >
            <div className="flex items-start gap-5">
              <span aria-hidden="true" className="mt-3.5 hidden h-px w-12 shrink-0 bg-vermilion-500 sm:block" />
              <p className="max-w-prose text-lg/relaxed text-fg-muted md:text-xl/relaxed">{heroSubcopy}</p>
            </div>
            <div className="mt-9 sm:pl-17">
              <HeroCtas ctas={heroCtas} />
            </div>
          </div>

          {hasImage ? (
            <div className="relative animate-fade-up [animation-delay:240ms] lg:col-span-7">
              <SmartImage
                image={heroImage}
                alt="Melophile — Nepali music"
                sizes="(min-width: 1408px) 820px, (min-width: 1024px) 58vw, 100vw"
                preload
                quality={90}
                className="aspect-[4/3] rounded-xl border border-line sm:aspect-[16/10]"
                imgClassName="transition-transform duration-700 ease-out-expo hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-t from-bg/70 via-bg/10 to-transparent"
              />
              <RecordSticker className="absolute -top-10 right-4 size-28 sm:size-32 lg:-top-14 lg:-left-14 lg:right-auto lg:size-36" />
            </div>
          ) : (
            <div className="hidden animate-fade-up items-start [animation-delay:240ms] lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:flex">
              <RecordSticker className="size-44 xl:size-52" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
