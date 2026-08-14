import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "./lib/cn";
import styles from "./tag.module.css";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  /** muted: nötr; outline: çizgili; accent: kategori rengi */
  tone?: "muted" | "outline" | "accent";
  /** tone=accent iken kategori rengi */
  accentColor?: string | null;
};

/** Kategori/etiket — aksan yalnız tone=accent */
export function Tag({
  children,
  className,
  tone = "muted",
  accentColor,
  style,
  ...props
}: TagProps) {
  const themed = Boolean(accentColor?.startsWith("#"));
  return (
    <span
      className={cn(styles.tag, styles[tone], className)}
      style={
        themed
          ? ({
              ...style,
              ["--tag-accent" as string]: accentColor,
            } as CSSProperties)
          : style
      }
      {...props}
    >
      {children}
    </span>
  );
}
