/**
 * Çerez tercihleri — localStorage
 */
export const COOKIE_CONSENT_KEY = "yh-cookie-consent-v1";

export type CookiePrefs = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export type CookieConsent = {
  version: 1;
  decidedAt: string;
  /** all | custom | necessary */
  choice: "all" | "custom" | "necessary";
  prefs: CookiePrefs;
};

export const DEFAULT_PREFS: CookiePrefs = {
  necessary: true,
  functional: false,
  analytics: false,
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.version !== 1 || !parsed.prefs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(data: CookieConsent): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("yh-cookie-consent", { detail: data }));
}

export function acceptAllCookies(): CookieConsent {
  const data: CookieConsent = {
    version: 1,
    decidedAt: new Date().toISOString(),
    choice: "all",
    prefs: { necessary: true, functional: true, analytics: true },
  };
  writeCookieConsent(data);
  return data;
}

export function saveCustomCookies(prefs: Omit<CookiePrefs, "necessary">): CookieConsent {
  const data: CookieConsent = {
    version: 1,
    decidedAt: new Date().toISOString(),
    choice: "custom",
    prefs: {
      necessary: true,
      functional: prefs.functional,
      analytics: prefs.analytics,
    },
  };
  writeCookieConsent(data);
  return data;
}

export function acceptNecessaryOnly(): CookieConsent {
  const data: CookieConsent = {
    version: 1,
    decidedAt: new Date().toISOString(),
    choice: "necessary",
    prefs: { ...DEFAULT_PREFS },
  };
  writeCookieConsent(data);
  return data;
}
