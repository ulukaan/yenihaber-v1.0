"use client";

import { SITE_ORIGIN } from "@/lib/public-env";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApiMarkets, ApiPrayer, ApiSports } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { adminApi } from "@/lib/api";
import styles from "./services.module.css";

const WEB = (SITE_ORIGIN).replace(
  /\/$/,
  "",
);

/**
 * Servis paneli — canlı skor, namaz, hava, piyasa, akaryakıt özeti.
 */
export default function ServicesPage() {
  const [sports, setSports] = useState<ApiSports | null>(null);
  const [prayer, setPrayer] = useState<ApiPrayer | null>(null);
  const [markets, setMarkets] = useState<ApiMarkets | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, p, m] = await Promise.all([
          adminApi.sports.get().catch(() => null),
          adminApi.prayer.get("duzce").catch(() => null),
          adminApi.markets.get().catch(() => null),
        ]);
        if (cancelled) return;
        setSports(s);
        setPrayer(p);
        setMarkets(m);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Servisler yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usd =
    markets?.fx.find((x) => /USD/i.test(x.code + x.label)) ?? markets?.fx[0];
  const matches = [
    ...(sports?.live ?? []),
    ...(sports?.recent ?? []),
  ].slice(0, 5);
  const prayerRows = prayer
    ? [
        ["İmsak", prayer.times.imsak],
        ["Güneş", prayer.times.gunes],
        ["Öğle", prayer.times.ogle],
        ["İkindi", prayer.times.ikindi],
        ["Akşam", prayer.times.aksam],
        ["Yatsı", prayer.times.yatsi],
      ]
    : [];

  return (
    <AdminShell>
      <AdminPage
        title="Servisler"
        subtitle="Canlı özet — kaynak API · sitedeki servis sayfaları public web’te"
        wide
      >
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.grid}>
          <section id="skor" className={styles.card}>
            <h2>Canlı skor</h2>
            <p className={styles.lead}>
              {matches.length
                ? `${sports?.leagueName || "Lig"} · ${matches.length} maç`
                : "Skor verisi yok veya sağlayıcı kapalı"}
            </p>
            <ul className={styles.rows}>
              {matches.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.home} – {m.away}
                  </span>
                  <strong>
                    {m.homeScore} : {m.awayScore}
                    <em> · {m.minute}</em>
                  </strong>
                </li>
              ))}
            </ul>
            <a
              className={styles.link}
              href={`${WEB}/servis`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitede gör
            </a>
          </section>

          <section id="namaz" className={styles.card}>
            <h2>Namaz vakitleri</h2>
            {prayer ? (
              <>
                <p className={styles.lead}>
                  {prayer.city.name} · sıradaki {prayer.next.label}{" "}
                  {prayer.next.time}
                </p>
                <ul className={styles.rows}>
                  {prayerRows.map(([k, v]) => (
                    <li key={k}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.muted}>Namaz verisi alınamadı</p>
            )}
            <a
              className={styles.link}
              href={`${WEB}/servis/namaz`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitede gör
            </a>
          </section>

          <section id="hava" className={styles.card}>
            <h2>Hava durumu</h2>
            <p className={styles.lead}>
              Public sitede CollectAPI veya yedek kaynak ile sunulur.
            </p>
            <a
              className={styles.link}
              href={`${WEB}/servis/hava`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitede gör
            </a>
          </section>

          <section id="piyasa" className={styles.card}>
            <h2>Piyasalar</h2>
            {usd ? (
              <p className={styles.lead}>
                {usd.label}: {usd.value}{" "}
                <span className={styles.muted}>({usd.change || "—"})</span>
              </p>
            ) : (
              <p className={styles.muted}>Piyasa verisi yok</p>
            )}
            <ul className={styles.rows}>
              {(markets?.fx ?? []).slice(0, 5).map((x) => (
                <li key={x.code + x.label}>
                  <span>{x.label}</span>
                  <strong>{x.value}</strong>
                </li>
              ))}
            </ul>
            <a
              className={styles.link}
              href={`${WEB}/servis/doviz`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitede gör
            </a>
          </section>

          <section id="akaryakit" className={styles.card}>
            <h2>Akaryakıt & emtia</h2>
            <p className={styles.lead}>
              Yakıt satırları döviz paneli ile birlikte public sitede yer alır.
              Altın/emtia panosu:
            </p>
            <ul className={styles.rows}>
              {(markets?.gold ?? []).slice(0, 6).map((f) => (
                <li key={f.code + f.label}>
                  <span>{f.label}</span>
                  <strong>{f.value}</strong>
                </li>
              ))}
            </ul>
            <Link className={styles.link} href="/settings">
              Kaynak ayarları
            </Link>
          </section>
        </div>
      </AdminPage>
    </AdminShell>
  );
}
