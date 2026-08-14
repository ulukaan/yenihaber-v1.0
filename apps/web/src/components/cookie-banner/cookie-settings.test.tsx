import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS } from "@/lib/cookie-consent";

describe("cookie-settings", () => {
  it("zorunlu tercih her zaman true", () => {
    expect(DEFAULT_PREFS.necessary).toBe(true);
  });
});
