import { Tag } from "@/components/ui/Badge";
import { hrefWithQuery } from "@/components/ui/href";
import { cn, slugify } from "@/lib/utils";

export interface ArticleTagsProps {
  tags: readonly string[];
  className?: string;
}

/** "Tagged" row: each tag links to /news?tag=<slug>. Tags that cannot be slugged are shown unlinked. */
export function ArticleTags({ tags, className }: ArticleTagsProps) {
  const unique = Array.from(new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values()).filter((t) => t.trim());
  if (unique.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p id="article-tags-label" className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        Tagged
      </p>
      <ul aria-labelledby="article-tags-label" className="flex flex-wrap gap-2">
        {unique.map((tag) => {
          const slug = slugify(tag);
          return (
            <li key={tag}>
              <Tag href={slug ? hrefWithQuery("/news", { tag: slug }) : undefined}>
                <span aria-hidden="true" className="text-highlight">
                  #
                </span>
                {tag}
              </Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
