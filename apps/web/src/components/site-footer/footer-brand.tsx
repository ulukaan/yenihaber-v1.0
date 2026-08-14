"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import styles from "./site-footer.module.css";

type Props = {
  siteName: string;
};

/**
 * Logo varsa yalnız logo; yüklenemezse site adı.
 */
export function FooterBrand({ siteName }: Props) {
  const [logoOk, setLogoOk] = useState(true);

  if (!logoOk) {
    return (
      <p className={styles.brandName}>
        <Link href="/">{siteName}</Link>
      </p>
    );
  }

  return (
    <BrandLogo
      variant="onDark"
      size="lg"
      className={styles.logo}
      onError={() => setLogoOk(false)}
    />
  );
}
