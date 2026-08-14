import { describe, expect, it } from "vitest";
import { tarihBicimle } from "./format-date";

describe("tarihBicimle", () => {
  it("24 saatten yeniyse göreli verir", () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(tarihBicimle(d, "auto")).toBe("3 saat önce");
  });

  it("eski tarihte mutlak verir", () => {
    const d = "2024-01-15T10:00:00.000Z";
    const out = tarihBicimle(d, "auto");
    expect(out).toMatch(/2024/);
    expect(out).not.toMatch(/önce/);
  });

  it("boş değer boş string", () => {
    expect(tarihBicimle(null)).toBe("");
  });
});
