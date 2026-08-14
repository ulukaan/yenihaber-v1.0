"use client";

import { SITE_ORIGIN } from "@/lib/public-env";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import type { ApiArticle, Role } from "@yenihaber/shared";
import { ChevronDown } from "lucide-react";
import styles from "./articles.module.css";

export function FlagToggle({
  title,
  on,
  disabled,
  tone,
  onClick,
}: {
  title: string;
  on: boolean;
  disabled?: boolean;
  tone: "m" | "sm" | "oc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        on
          ? tone === "m"
            ? styles.flagOnM
            : tone === "sm"
              ? styles.flagOnSm
              : styles.flagOnOc
          : styles.flagOff
      }
      title={title}
      aria-label={title}
      aria-pressed={on}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {on ? "✓" : ""}
    </button>
  );
}

const WEB_URL = (
  SITE_ORIGIN
).replace(/\/$/, "");

/** Resmi marka SVG logoları (paylaş satırı) */
export function IconFacebook({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

export function IconX({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.727-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export function IconWhatsApp({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function IconInstagram({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

/** Instagram web paylaşımı yok — linki panoya kopyalar */
export function ShareInstagramButton({
  url,
  disabled,
}: {
  url: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(e: ReactMouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className={styles.shareIg}
      aria-label={
        copied
          ? "Link kopyalandı — Instagram’da yapıştırın"
          : "Instagram için linki kopyala"
      }
      title={
        copied
          ? "Kopyalandı — Instagram’da yapıştırın"
          : "Instagram (linki kopyala)"
      }
      onClick={(e) => void copy(e)}
      data-disabled={disabled || undefined}
      disabled={disabled}
    >
      <IconInstagram />
    </button>
  );
}

export function IslemlerMenu({
  row,
  role,
  publisher,
  onHardDelete,
  onArchive,
}: {
  row: ApiArticle;
  role: Role;
  publisher: boolean;
  onHardDelete: (id: string) => void;
  onArchive?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: globalThis.MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const publicUrl = `${WEB_URL}/haber/${row.slug}`;
  const canSoftDelete = Boolean(
    publisher && onArchive && row.status !== "ARSIV",
  );
  const canHardDelete = role === "ADMIN";

  return (
    <div className={styles.islemWrap} ref={ref}>
      <button
        type="button"
        className={styles.islemBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        İşlemler
        <ChevronDown size={14} aria-hidden />
      </button>
      {open ? (
        <ul className={styles.islemMenu} role="menu">
          <li role="none">
            <Link
              role="menuitem"
              href={`/articles/${row.id}`}
              onClick={() => setOpen(false)}
            >
              Düzenle
            </Link>
          </li>
          {row.status === "YAYINDA" ? (
            <li role="none">
              <a
                role="menuitem"
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                Sitede görüntüle
              </a>
            </li>
          ) : null}
          <li role="none">
            <Link
              role="menuitem"
              href={`/articles/${row.id}/done?created=0`}
              onClick={() => setOpen(false)}
            >
              Paylaş / başarı ekranı
            </Link>
          </li>
          {canSoftDelete ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={styles.islemDanger}
                onClick={() => {
                  setOpen(false);
                  onArchive?.(row.id);
                }}
              >
                Sil (arşive taşı)
              </button>
            </li>
          ) : null}
          {canHardDelete ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={styles.islemDanger}
                onClick={() => {
                  setOpen(false);
                  onHardDelete(row.id);
                }}
              >
                {row.status === "ARSIV"
                  ? "Kalıcı sil"
                  : "Kalıcı sil (geri alınamaz)"}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
