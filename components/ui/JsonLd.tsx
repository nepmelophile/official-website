/** A JSON-LD object (or @graph) for schema.org structured data. */
export type JsonLdData = Record<string, unknown>;

export interface JsonLdProps {
  /** A schema.org object (or `{ "@context", "@graph" }`). Must be JSON-serialisable. */
  data: JsonLdData;
  id?: string;
}

const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

/**
 * Serialises structured data for an inline `<script type="application/ld+json">`.
 * `<`, `>`, `&` and U+2028/2029 are escaped so editor-authored strings can never close the
 * script tag or inject markup. Empty strings are dropped (schema.org treats them as noise).
 */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data, (_key, value: unknown) => (value === "" ? undefined : value))
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEPARATOR, "\\u2028")
    .replace(PARAGRAPH_SEPARATOR, "\\u2029");
}

/** Renders schema.org structured data (Next.js recommends a plain script tag in the page). */
export function JsonLd({ data, id }: JsonLdProps) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
