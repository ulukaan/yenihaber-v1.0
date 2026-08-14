import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./lib/cn";
import styles from "./card.module.css";

export type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "div" | "article" | "section";
  interactive?: boolean;
  /** Panel/tablo istisnası — varsayılan çerçevesiz */
  framed?: boolean;
};

/** Etkileşimli içerik kapsayıcısı — haber kartları çerçevesiz */
export function Card({
  children,
  className,
  as: Tag = "div",
  interactive = false,
  framed = false,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        styles.card,
        framed && styles.framed,
        interactive && styles.interactive,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
