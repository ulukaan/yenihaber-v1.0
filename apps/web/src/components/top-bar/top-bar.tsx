import styles from "./top-bar.module.css";

/** Üst yardımcı şerit — tarih, hava, site linkleri */
export function TopBar() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className={styles.bar}>
      <div className={`yh-container ${styles.inner}`}>
        <div className={styles.left}>
          <time dateTime={now.toISOString()}>{date}</time>
          <span className={styles.dot} aria-hidden />
          <span className={styles.weather}>Düzce 24° · Parçalı bulutlu</span>
        </div>
        <div className={styles.right}>
          <a href="/iletisim">İletişim</a>
          <a href="/kunye">Künye</a>
          <a href="/servis">Servisler</a>
        </div>
      </div>
    </div>
  );
}
