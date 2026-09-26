import type { Metadata } from "next";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getLatestArticles } from "@/lib/queries/articles";

export const metadata: Metadata = {
  title: "Story not found",
  robots: { index: false, follow: true },
};

/** 404 for /news/[slug]: missing, renamed or unpublished stories. Suggests the latest headlines. */
export default async function ArticleNotFound() {
  const latest = await getLatestArticles(3);

  return (
    <>
      <Section tone="glow" spacing="none" aria-labelledby="story-not-found" className="pt-16 pb-16 md:pt-24 md:pb-24">
        <SectionHeading
          as="h1"
          id="story-not-found"
          size="xl"
          hairline={false}
          index="404"
          eyebrow="Story not found"
          title={
            <>
              This story has <em>left the stage</em>.
            </>
          }
          description={
            <p>
              The article you&apos;re looking for may have been unpublished, renamed or never existed. The latest
              headlines are just a click away.
            </p>
          }
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/news" icon="arrow-right">
            Browse all news
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
      </Section>

      {latest.length > 0 ? (
        <Section tone="alt" spacing="tight" aria-labelledby="latest-heading" className="border-t border-line">
          <SectionHeading
            id="latest-heading"
            eyebrow="Latest"
            title={
              <>
                Fresh off the <em>press</em>
              </>
            }
            size="md"
            action={{ label: "All news", href: "/news" }}
          />
          <ul className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3">
            {latest.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} variant="compact" headingLevel="h3" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
