import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  content: "max-w-content",
  reading: "max-w-reading",
  narrow: "max-w-narrow",
  full: "max-w-none",
} as const;

export type ContainerSize = keyof typeof SIZES;

type ContainerProps<T extends ElementType> = {
  /** Element to render (default `div`). */
  as?: T;
  /** Max width: content (88rem, default), reading (44rem), narrow (36rem) or full. */
  size?: ContainerSize;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** Page-width wrapper: `mx-auto w-full max-w-* px-gutter`. */
export function Container<T extends ElementType = "div">({
  as,
  size = "content",
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component className={cn("mx-auto w-full px-gutter", SIZES[size], className)} {...rest}>
      {children}
    </Component>
  );
}
