import { prisma } from "@yenihaber/database";
import {
  SETTINGS_DEFAULTS,
  SETTINGS_GROUPS,
  SETTINGS_SECRET_KEYS,
  THEME_PALETTES,
  type SettingsBundle,
  type SettingsGroup,
  type SettingsMap,
} from "@yenihaber/shared";

const LEGACY_MAP: Record<string, string> = {
  siteName: "site.name",
  siteTagline: "site.tagline",
  contactEmail: "email.fromAddress",
};

const FALLBACK_COVER =
  SETTINGS_DEFAULTS["content.defaultCoverUrl"]?.value ??
  "/brand/default-cover.svg";

/** mapArticle senkron okur — ayar kaydında / loadSettingsFlat ile güncellenir */
let cachedDefaultCoverUrl = FALLBACK_COVER;

/** Habere kapak yoksa kullanılan site varsayılanı (senkron) */
export function peekDefaultCoverUrl(): string {
  return cachedDefaultCoverUrl || FALLBACK_COVER;
}

function rememberDefaultCover(url: string | undefined | null) {
  const next = (url ?? "").trim();
  cachedDefaultCoverUrl = next || FALLBACK_COVER;
}

/** Tüm satırları oku + varsayılanlarla birleştir */
export async function loadSettingsFlat(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const flat: SettingsMap = {};
  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    flat[key] = def.value;
  }
  for (const row of rows) {
    flat[row.key] = row.value;
  }
  // legacy → new
  for (const [legacy, modern] of Object.entries(LEGACY_MAP)) {
    if (rows.some((r) => r.key === legacy) && !rows.some((r) => r.key === modern)) {
      flat[modern] = flat[legacy] ?? flat[modern];
    }
  }
  // new → legacy mirrors for old pages
  flat.siteName = flat["site.name"] || flat.siteName || "Düzce Radikal";
  flat.siteTagline = flat["site.tagline"] || flat.siteTagline || "";
  if (flat["email.fromAddress"]) flat.contactEmail = flat["email.fromAddress"];
  rememberDefaultCover(flat["content.defaultCoverUrl"]);
  return flat;
}

export function buildBundle(
  flat: SettingsMap,
  opts?: { maskSecrets?: boolean },
): SettingsBundle {
  const byGroup = {} as Record<SettingsGroup, SettingsMap>;
  for (const g of SETTINGS_GROUPS) byGroup[g] = {};

  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    const g = def.group;
    let val = flat[key] ?? def.value;
    if (opts?.maskSecrets && SETTINGS_SECRET_KEYS.has(key) && val) {
      val = "••••••••";
    }
    byGroup[g][key] = val;
  }

  // also include any custom keys stored in DB for each known prefix
  for (const [key, val] of Object.entries(flat)) {
    if (SETTINGS_DEFAULTS[key]) continue;
    if (opts?.maskSecrets && SETTINGS_SECRET_KEYS.has(key) && val) continue;
    const g = (key.split(".")[0] || "site") as SettingsGroup;
    if (SETTINGS_GROUPS.includes(g)) {
      byGroup[g][key] = val;
    }
  }

  const outFlat: SettingsMap = { ...flat };
  if (opts?.maskSecrets) {
    for (const k of SETTINGS_SECRET_KEYS) {
      if (outFlat[k]) outFlat[k] = "••••••••";
    }
  }

  return { byGroup, flat: outFlat, secretsMasked: opts?.maskSecrets };
}

export async function getPublicSettings(): Promise<SettingsMap> {
  const flat = await loadSettingsFlat();
  const pub: SettingsMap = {};
  for (const [k, v] of Object.entries(flat)) {
    if (SETTINGS_SECRET_KEYS.has(k)) continue;
    if (k.startsWith("email.smtp")) continue;
    pub[k] = v;
  }
  return pub;
}

export async function getGroupValues(group: SettingsGroup): Promise<SettingsMap> {
  const flat = await loadSettingsFlat();
  const out: SettingsMap = {};
  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    if (def.group === group) out[key] = flat[key] ?? def.value;
  }
  return out;
}

/**
 * Grup kaydı — yalnızca o gruba ait anahtarlar
 * smtpPass "••••••••" ise mevcut şifre korunur
 */
export async function saveGroup(
  group: SettingsGroup,
  patch: SettingsMap,
  actorId: string | null,
): Promise<SettingsMap> {
  const allowed = new Set(
    Object.entries(SETTINGS_DEFAULTS)
      .filter(([, d]) => d.group === group)
      .map(([k]) => k),
  );

  // allow also keys already under this group in DB with matching prefix
  for (const key of Object.keys(patch)) {
    const def = SETTINGS_DEFAULTS[key];
    if (def && def.group !== group) {
      throw new Error(`${key} bu sekmeye ait değil`);
    }
    if (!def && !key.startsWith(group === "appearance" ? "theme." : `${group}.`) &&
        !(group === "appearance" && key.startsWith("panel.")) &&
        !allowed.has(key)) {
      // loose: accept known group prefixes
      if (!(key.startsWith("theme.") || key.startsWith("panel.") || key.startsWith(`${group}.`))) {
        if (!allowed.has(key)) continue;
      }
    }
  }

  // palette apply — site + panel aynı marka
  if (group === "appearance" && patch["theme.paletteId"] && patch["theme.paletteId"] !== "custom") {
    const pal = THEME_PALETTES.find((p) => p.id === patch["theme.paletteId"]);
    if (pal && pal.id !== "custom") {
      patch["theme.primary"] = pal.primary;
      patch["theme.accent"] = pal.accent;
      patch["theme.link"] = pal.link;
      patch["theme.breaking"] = pal.breaking;
      patch["panel.accent"] = pal.accent;
    }
  } else if (
    group === "appearance" &&
    patch["theme.accent"] &&
    (!patch["panel.accent"] || !String(patch["panel.accent"]).trim())
  ) {
    patch["panel.accent"] = patch["theme.accent"];
  }

  const existing = await loadSettingsFlat();
  const changes: Array<{ key: string; from: string; to: string }> = [];

  for (const [key, raw] of Object.entries(patch)) {
    const def = SETTINGS_DEFAULTS[key];
    if (def && def.group !== group) continue;
    if (!def && !allowed.has(key)) {
      const prefixOk =
        (group === "appearance" &&
          (key.startsWith("theme.") || key.startsWith("panel."))) ||
        key.startsWith(`${group}.`) ||
        (group === "site" &&
          ["siteName", "siteTagline", "contactEmail", "liveYouTubeUrl"].includes(
            key,
          ));
      if (!prefixOk) continue;
    }

    let value = String(raw ?? "");
    if (
      key === "email.smtpPass" &&
      (value === "••••••••" || value === "********")
    ) {
      continue;
    }

    const prev = existing[key] ?? "";
    if (prev === value) continue;

    const gName = def?.group ?? group;
    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value,
        groupName: gName,
        updatedById: actorId,
      },
      update: {
        value,
        groupName: gName,
        updatedById: actorId,
      },
    });
    changes.push({ key, from: prev, to: value });
  }

  // mirror legacy site fields
  if (group === "site") {
    const mirrors: Record<string, string> = {};
    if (patch["site.name"] !== undefined) mirrors.siteName = patch["site.name"];
    if (patch["site.tagline"] !== undefined)
      mirrors.siteTagline = patch["site.tagline"];
    for (const [k, v] of Object.entries(mirrors)) {
      await prisma.setting.upsert({
        where: { key: k },
        create: { key: k, value: v, groupName: "site", updatedById: actorId },
        update: { value: v, groupName: "site", updatedById: actorId },
      });
    }
  }

  if (changes.length && actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "settings.update",
        entityType: "settings",
        entityId: group,
        meta: JSON.stringify({
          group,
          keys: changes.map((c) => c.key),
          // secrets stripped
          diff: changes.map((c) => ({
            key: c.key,
            from: SETTINGS_SECRET_KEYS.has(c.key) ? "•••" : c.from.slice(0, 80),
            to: SETTINGS_SECRET_KEYS.has(c.key) ? "•••" : c.to.slice(0, 80),
          })),
        }),
      },
    });
  }

  if (
    group === "content" ||
    changes.some((c) => c.key === "content.defaultCoverUrl")
  ) {
    const coverChange = changes.find((c) => c.key === "content.defaultCoverUrl");
    if (coverChange) {
      rememberDefaultCover(coverChange.to);
    } else if (patch["content.defaultCoverUrl"] !== undefined) {
      rememberDefaultCover(patch["content.defaultCoverUrl"]);
    } else {
      const flat = await loadSettingsFlat();
      rememberDefaultCover(flat["content.defaultCoverUrl"]);
    }
  }

  return getGroupValues(group);
}

/** SMTP config — DB + env fallback */
export async function resolveMailConfig(): Promise<{
  fromName: string;
  fromAddress: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}> {
  const flat = await loadSettingsFlat();
  return {
    fromName:
      flat["email.fromName"] ||
      process.env.PUBLIC_SITE_NAME ||
      "Düzce Radikal",
    fromAddress:
      flat["email.fromAddress"] ||
      process.env.SMTP_FROM ||
      process.env.MAIL_FROM ||
      "",
    host: flat["email.smtpHost"] || process.env.SMTP_HOST || "",
    port: Number(flat["email.smtpPort"] || process.env.SMTP_PORT || 587),
    user: flat["email.smtpUser"] || process.env.SMTP_USER || "",
    pass: flat["email.smtpPass"] || process.env.SMTP_PASS || "",
    secure:
      flat["email.smtpSecure"] === "1" ||
      process.env.SMTP_SECURE === "1" ||
      Number(flat["email.smtpPort"] || 587) === 465,
  };
}
