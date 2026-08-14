import { getSiteSettings } from "@/lib/site-settings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

/** Bakım sayfası — middleware rewrite */
export default async function MaintenancePage() {
  const s = await getSiteSettings();
  const name = s["site.name"] || s.siteName || "Düzce Radikal";
  const msg =
    s["site.maintenanceMessage"] ||
    "Site bakımda. Kısa süre içinde döneceğiz.";

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.brand}>{name}</p>
        <h1>Bakım çalışması</h1>
        <p>{msg}</p>
      </div>
    </main>
  );
}
