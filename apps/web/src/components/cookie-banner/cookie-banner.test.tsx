import { beforeEach, describe, expect, it } from "vitest";
import {
  COOKIE_CONSENT_KEY,
  acceptAllCookies,
  acceptNecessaryOnly,
  readCookieConsent,
  saveCustomCookies,
} from "@/lib/cookie-consent";

describe("cookie-consent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("acceptAll tüm tercihleri açar", () => {
    const c = acceptAllCookies();
    expect(c.choice).toBe("all");
    expect(c.prefs.analytics).toBe(true);
    expect(readCookieConsent()?.prefs.functional).toBe(true);
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBeTruthy();
  });

  it("yalnızca zorunlu kaydeder", () => {
    const c = acceptNecessaryOnly();
    expect(c.choice).toBe("necessary");
    expect(c.prefs.analytics).toBe(false);
  });

  it("özel tercihler kaydedilir", () => {
    const c = saveCustomCookies({ functional: true, analytics: false });
    expect(c.choice).toBe("custom");
    expect(c.prefs.functional).toBe(true);
    expect(c.prefs.analytics).toBe(false);
  });
});
