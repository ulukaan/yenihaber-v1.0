import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
  isSettingsGroup,
  passesContrastAA,
  SETTINGS_GROUP_LABELS,
  SETTINGS_GROUPS,
  THEME_PALETTES,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import { clientIp } from "../lib/ip";
import { sendMail } from "../lib/mail";
import {
  buildBundle,
  getPublicSettings,
  loadSettingsFlat,
  resolveMailConfig,
  saveGroup,
} from "../lib/settings";
import { revalidateWeb } from "../lib/revalidate";

export const settingsRoutes = new Hono<{ Variables: AuthVariables }>();

function revalidateSettings() {
  void revalidateWeb(["/"], ["ayarlar"]);
}

/** Public (gizli alanlar yok) — geriye uyumlu flat map */
settingsRoutes.get("/", async (c) => {
  const flat = await getPublicSettings();
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return c.json(flat);
});

/** Public paketlenmiş */
settingsRoutes.get("/bundle", async (c) => {
  const flat = await getPublicSettings();
  return c.json(buildBundle(flat, { maskSecrets: true }));
});

/** Paletler + kontrast yardımcıları (panel) */
settingsRoutes.get("/meta", requireAuth, requireRole("ADMIN"), async (c) => {
  return c.json({
    groups: SETTINGS_GROUPS.map((id) => ({
      id,
      label: SETTINGS_GROUP_LABELS[id],
    })),
    palettes: THEME_PALETTES,
  });
});

/** Admin tam paket (şifre maskeli) */
settingsRoutes.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const flat = await loadSettingsFlat();
    return c.json(buildBundle(flat, { maskSecrets: true }));
  },
);

/** Grup kaydet — sadece o sekme */
settingsRoutes.put(
  "/group/:group",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const groupParam = c.req.param("group")!;
    if (!isSettingsGroup(groupParam)) {
      throw new HTTPException(400, { message: "Geçersiz sekme" });
    }
    const body = z.record(z.string()).parse(await c.req.json());

    // appearance: özel renk kontrastı
    if (groupParam === "appearance" && body["theme.paletteId"] === "custom") {
      const primary = body["theme.primary"] || "#2B2D42";
      const onWhite = passesContrastAA(primary, "#FFFFFF");
      if (!onWhite.ok) {
        throw new HTTPException(422, {
          message: `Ana renk beyaz zeminde zayıf kontrast (${onWhite.ratio}:1). En az 4.5:1 olmalı.`,
        });
      }
      const accent = body["theme.accent"] || "#EF233C";
      const accentW = passesContrastAA(accent, "#FFFFFF");
      if (!accentW.ok) {
        throw new HTTPException(422, {
          message: `Vurgu rengi beyaz zeminde zayıf kontrast (${accentW.ratio}:1).`,
        });
      }
    }

    const user = c.get("user");
    try {
      const saved = await saveGroup(groupParam, body, user.id);
      if (
        groupParam === "content" &&
        body["content.homeMansetCount"] !== undefined
      ) {
        const n = Math.min(
          24,
          Math.max(1, Math.round(Number(body["content.homeMansetCount"]) || 12)),
        );
        const { saveMansetSettings } = await import("../lib/front-layout");
        await saveMansetSettings({ desktopLimit: n, mainLimit: n });
        void revalidateWeb(["/"], ["anasayfa", "manset"]);
      }
      revalidateSettings();
      return c.json({
        ok: true as const,
        group: groupParam,
        values: saved,
      });
    } catch (e) {
      throw new HTTPException(400, {
        message: e instanceof Error ? e.message : "Kayıt başarısız",
      });
    }
  },
);

/** Eski tam PUT — hâlâ destek (legacy formlar) */
settingsRoutes.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const body = z.record(z.string()).parse(await c.req.json());
    const user = c.get("user");
    // group inference
    const byGroup: Record<string, Record<string, string>> = {};
    for (const [k, v] of Object.entries(body)) {
      const g = k.includes(".")
        ? k.split(".")[0]!
        : "site";
      const group = isSettingsGroup(g)
        ? g
        : k.startsWith("theme.") || k.startsWith("panel.")
          ? "appearance"
          : "site";
      byGroup[group] = byGroup[group] || {};
      byGroup[group]![k] = v;
    }
    for (const [g, patch] of Object.entries(byGroup)) {
      if (isSettingsGroup(g)) await saveGroup(g, patch, user.id);
    }
    revalidateSettings();
    return c.json(await getPublicSettings());
  },
);

/** Test e-postası */
settingsRoutes.post(
  "/test-email",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const body = z
      .object({
        to: z.string().email().optional(),
      })
      .parse(await c.req.json().catch(() => ({})));
    const user = c.get("user");
    const to = body.to || user.email;
    const cfg = await resolveMailConfig();

    // Apply runtime env override for sendMail via temporary process.env
    const prev = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
      secure: process.env.SMTP_SECURE,
    };
    if (cfg.host) process.env.SMTP_HOST = cfg.host;
    if (cfg.port) process.env.SMTP_PORT = String(cfg.port);
    if (cfg.user) process.env.SMTP_USER = cfg.user;
    if (cfg.pass) process.env.SMTP_PASS = cfg.pass;
    if (cfg.fromAddress) process.env.SMTP_FROM = cfg.fromAddress;
    process.env.SMTP_SECURE = cfg.secure ? "1" : "0";

    try {
      const result = await sendMail({
        to,
        subject: `[Test] ${cfg.fromName} e-posta ayarları`,
        text: [
          `Merhaba ${user.name},`,
          ``,
          `Bu bir test e-postasıdır.`,
          `Gönderen: ${cfg.fromName} <${cfg.fromAddress || "noreply"}>`,
          `SMTP: ${cfg.host || "(log/webhook)"}:${cfg.port}`,
          `IP: ${clientIp(c.req.raw.headers)}`,
          `Zaman: ${new Date().toISOString()}`,
          ``,
          `Ayarlar paneli çalışıyor.`,
        ].join("\n"),
      });

      await c.get("user");
      // audit
      const { prisma } = await import("@yenihaber/database");
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "settings.test_email",
          entityType: "settings",
          entityId: "email",
          meta: JSON.stringify({ to, mode: result.mode, ok: result.ok }),
        },
      });

      return c.json({
        ok: result.ok,
        mode: result.mode,
        to,
        message:
          result.mode === "log"
            ? "SMTP yok — mail konsola yazıldı (mod: log)"
            : `Test maili gönderildi (${result.mode})`,
      });
    } finally {
      if (prev.host !== undefined) process.env.SMTP_HOST = prev.host;
      else delete process.env.SMTP_HOST;
      if (prev.port !== undefined) process.env.SMTP_PORT = prev.port;
      else delete process.env.SMTP_PORT;
      if (prev.user !== undefined) process.env.SMTP_USER = prev.user;
      else delete process.env.SMTP_USER;
      if (prev.pass !== undefined) process.env.SMTP_PASS = prev.pass;
      else delete process.env.SMTP_PASS;
      if (prev.from !== undefined) process.env.SMTP_FROM = prev.from;
      else delete process.env.SMTP_FROM;
      if (prev.secure !== undefined) process.env.SMTP_SECURE = prev.secure;
      else delete process.env.SMTP_SECURE;
    }
  },
);
