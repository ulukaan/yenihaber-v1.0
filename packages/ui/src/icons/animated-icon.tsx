/**
 * İkon sarmalayıcı — Flaticon animasyon estetiğine yakın hafif hareket.
 * Telifli Flaticon Lottie dosyası kullanılmaz; Lucide/SVG + CSS.
 */

import type { CSSProperties, ReactNode } from "react";
import styles from "./animated-icon.module.css";

export type AnimatedIconMotion = "none" | "pop" | "pulse" | "float";

export type AnimatedIconProps = {
  children: ReactNode;
  motion?: AnimatedIconMotion;
  className?: string;
  style?: CSSProperties;
  /** Dış kutu (sosyal buton vb.) */
  boxed?: boolean;
};

export function AnimatedIcon({
  children,
  motion = "pop",
  className,
  style,
  boxed = false,
}: AnimatedIconProps) {
  const cls = [
    styles.wrap,
    boxed ? styles.boxed : "",
    motion !== "none" ? styles[`m_${motion}`] : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={style} aria-hidden>
      {children}
    </span>
  );
}
