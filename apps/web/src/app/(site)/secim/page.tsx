import type { Metadata } from "next";
import { publicApi } from "@/lib/api";
import { ElectionCenter } from "@/components/election/election-center";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seçim Merkezi",
  description:
    "Canlı seçim sonuçları — sandık oranı, parti oyları ve meclis dağılımı.",
};

async function electionBrand() {
  try {
    const s = await publicApi.settings.get();
    const siteName = (s["content.electionCenterName"] || "").trim();
    const brandLabel = (s["content.electionCenterLabel"] || "").trim();
    const brandLogoUrl =
      (s["content.electionCenterLogo"] || "").trim() ||
      (s["site.logoDark"] || "").trim() ||
      "/brand/logo-on-dark.png";
    return { siteName, brandLabel, brandLogoUrl };
  } catch {
    return {
      siteName: "",
      brandLabel: "",
      brandLogoUrl: "/brand/logo-on-dark.png",
    };
  }
}

export default async function SecimPage() {
  const brand = await electionBrand();
  let bundle: Awaited<ReturnType<typeof publicApi.elections.live>> | null =
    null;
  try {
    bundle = await publicApi.elections.live();
  } catch {
    bundle = null;
  }

  if (!bundle?.election) {
    return (
      <div className={styles.page}>
        <div className={`yh-container ${styles.inner}`}>
          <h1>{brand.brandLabel || brand.siteName || "Seçim Merkezi"}</h1>
          <p className={styles.empty}>
            Şu an yayında seçim sonucu yok. Panelden seçimi{" "}
            <strong>Canlıya al</strong>ın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <ElectionCenter
        initial={bundle}
        siteName={brand.siteName}
        brandLabel={brand.brandLabel}
        brandLogoUrl={brand.brandLogoUrl}
      />
    </div>
  );
}
