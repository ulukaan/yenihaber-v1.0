import Image from "next/image";
import Link from "next/link";
import styles from "./brand-logo.module.css";

export type BrandLogoVariant = "color" | "onDark" | "mono";

export type BrandLogoProps = {
  /** color: açık zemin · onDark: koyu zemin (kırmızı+beyaz) · mono: tam beyaz */
  variant?: BrandLogoVariant;
  /** sm: menü · md: header · lg: footer / auth */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Link kapamasını kapat (zaten link içindeyse) */
  asChild?: boolean;
  priority?: boolean;
  onClick?: () => void;
  onError?: () => void;
};

const SRC: Record<BrandLogoVariant, string> = {
  color: "/brand/logo-color.png",
  onDark: "/brand/logo-on-dark.png",
  mono: "/brand/logo-mono.png",
};

const HEIGHT: Record<NonNullable<BrandLogoProps["size"]>, number> = {
  sm: 40,
  md: 56,
  lg: 64,
};

/**
 * Düzce Radikal logo — zemine göre variant.
 * color → header/açık; onDark → footer/koyu; mono → özel koyu zemin.
 */
export function BrandLogo({
  variant = "color",
  size = "md",
  className,
  asChild = false,
  priority = false,
  onClick,
  onError,
}: BrandLogoProps) {
  const h = HEIGHT[size];
  // 1024×366
  const w = Math.round(h * (1024 / 366));

  const img = (
    <Image
      src={SRC[variant]}
      alt="Düzce Radikal"
      width={w}
      height={h}
      className={styles.img}
      priority={priority}
      unoptimized
      onError={onError}
    />
  );

  const cls = [styles.logo, styles[size], className].filter(Boolean).join(" ");

  if (asChild) {
    return (
      <span className={cls} onClick={onClick}>
        {img}
      </span>
    );
  }

  return (
    <Link
      href="/"
      className={cls}
      aria-label="Düzce Radikal ana sayfa"
      onClick={onClick}
    >
      {img}
    </Link>
  );
}
