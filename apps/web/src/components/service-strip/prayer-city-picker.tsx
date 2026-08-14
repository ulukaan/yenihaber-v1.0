"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon } from "lucide-react";
import type { ApiPrayer, ApiPrayerCity } from "@yenihaber/shared";
import styles from "./service-strip.module.css";

const STORAGE_KEY = "yh-prayer-city";
const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type PrayerCityPickerProps = {
  initial?: ApiPrayer | null;
};

/** İl seçen namaz vakti — select yalnız tıklanınca açılır */
export function PrayerCityPicker({ initial }: PrayerCityPickerProps) {
  const [cities, setCities] = useState<ApiPrayerCity[]>([]);
  const [city, setCity] = useState(initial?.city.slug ?? "duzce");
  const [data, setData] = useState<ApiPrayer | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const load = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/prayer?city=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("prayer");
      const json = (await res.json()) as ApiPrayer;
      setData(json);
    } catch {
      // initial kalsın
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/prayer/cities`, {
          cache: "force-cache",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          cities: ApiPrayerCity[];
          defaultCity: string;
        };
        if (!cancelled) setCities(json.cities);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    const slug = saved || city;
    if (saved && saved !== city) setCity(saved);
    if (!initial || slug !== initial.city.slug) {
      void load(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    if (!picking) return;
    const el = selectRef.current;
    if (!el) return;
    el.focus();
    // Bazı tarayıcılarda native listeyi aç
    try {
      el.showPicker?.();
    } catch {
      // ignore
    }
  }, [picking]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    setCity(slug);
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // private mode
    }
    void load(slug);
    setPicking(false);
  }

  const label = data?.next.label ?? "Akşam";
  const time = data?.next.time ?? data?.times.aksam ?? "—";
  const cityName = data?.city.name ?? "İl";

  return (
    <div className={`${styles.item} ${styles.prayerItem}`}>
      <span className={styles.mark} aria-hidden>
        <Moon size={15} strokeWidth={2} />
      </span>
      <div className={styles.copy}>
        <span className={styles.label}>{loading ? "…" : label}</span>
        <strong className={styles.value}>{time}</strong>
      </div>

      <div className={styles.citySelectWrap}>
        {!picking ? (
          <button
            type="button"
            className={styles.cityChip}
            onClick={() => setPicking(true)}
            aria-label={`Namaz vakti ili: ${cityName}. Değiştirmek için tıklayın`}
            title="İl değiştir"
          >
            <span>{cityName}</span>
          </button>
        ) : (
          <select
            ref={selectRef}
            className={styles.citySelect}
            value={city}
            onChange={onChange}
            onBlur={() => setPicking(false)}
            aria-label="Namaz vakti ili seçin"
            title={cityName}
            size={1}
          >
            {(cities.length
              ? cities
              : [{ slug: city, name: cityName }]
            ).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
