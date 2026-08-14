"use client";

import { useEffect } from "react";
import { adminApi } from "@/lib/api";
import { applyAppearanceToDocument } from "@/lib/apply-theme";

/**
 * Panel açılınca kayıtlı görünüm ayarlarını site + panele uygular.
 */
export function PanelThemeBridge() {
  useEffect(() => {
    let cancelled = false;
    adminApi.settings
      .get()
      .then((flat) => {
        if (cancelled) return;
        applyAppearanceToDocument(flat);
      })
      .catch(() => {
        /* API yoksa varsayılan CSS */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
