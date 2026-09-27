import { Fragment, type ReactNode } from "react";

const MARKED = /\*([^*]+)\*/g;
const HAS_MARKER = /\*[^*]+\*/;
const AUTO_ACCENT = /\bNepal(?:i)?\b/;

/**
 * Turns an editor-written headline into React nodes with one serif-italic accent.
 *
 * - `*word*` marks the accent explicitly ("The sound of *Nepal*, amplified.").
 * - Without markers, the first "Nepal"/"Nepali" is accented, which matches the brand line.
 * - Otherwise the text is returned as-is.
 *
 * The accent is an `<em>`, styled as serif italic: highlight colour in SectionHeading, the
 * brand gradient in the hero.
 */
export function withAccent(text: string): ReactNode {
  const source = text.trim();
  if (!source) return source;

  if (HAS_MARKER.test(source)) {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    for (const match of source.matchAll(MARKED)) {
      const start = match.index ?? 0;
      if (start > cursor) nodes.push(source.slice(cursor, start));
      nodes.push(<em key={start}>{match[1]}</em>);
      cursor = start + match[0].length;
    }
    if (cursor < source.length) nodes.push(source.slice(cursor));
    return nodes.map((node, i) => <Fragment key={i}>{node}</Fragment>);
  }

  const auto = AUTO_ACCENT.exec(source);
  if (!auto) return source;
  const start = auto.index;
  return (
    <>
      {source.slice(0, start)}
      <em>{auto[0]}</em>
      {source.slice(start + auto[0].length)}
    </>
  );
}

/** Plain-text version of a headline (markers removed) for metadata and aria labels. */
export function stripAccentMarkers(text: string): string {
  return text.replace(MARKED, "$1").trim();
}
