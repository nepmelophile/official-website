/** Shared card class fragments. */

/** Put on the card root (`relative group`): shows the focus ring around the whole card. */
export const CARD_FOCUS =
  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-highlight";

/** Put on the single card link: stretches its hit area over the card, hides its own outline. */
export const STRETCHED_LINK = "focus-ring-custom focus-visible:outline-none after:absolute after:inset-0 after:z-10 after:content-['']";

/** Underline that grows from the left on card hover (wrap title text in a span with this). */
export const GROW_UNDERLINE =
  "bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_0.06em] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-out-expo group-hover:bg-size-[100%_0.06em]";

/** Image zoom on card hover. */
export const IMAGE_ZOOM = "transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]";

/** Mono metadata row. */
export const META = "font-mono text-xs uppercase tracking-[0.14em]";
