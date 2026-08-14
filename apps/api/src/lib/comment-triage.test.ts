import { describe, expect, it } from "vitest";
import { isHassasKategori, triyaj } from "./comment-triage";

const base = {
  hassasKategori: false,
  sonYorumSaniye: 120,
  gunlukSayi: 1,
  oncedenOnayliCihaz: true,
  isQuick: true,
};

describe("triyaj", () => {
  it("kısa metni reddeder", () => {
    expect(triyaj("ab", base)).toBe("reddet");
  });

  it("link içeren metni kuyruğa alır", () => {
    expect(triyaj("bakın https://x.com", base)).toBe("kuyruk");
  });

  it("temiz + onaylı cihaz yayınlar", () => {
    expect(triyaj("Güzel haber, tebrikler", base)).toBe("yayinla");
  });

  it("ilk cihazı kuyruğa alır", () => {
    expect(
      triyaj("Güzel haber, tebrikler", {
        ...base,
        oncedenOnayliCihaz: false,
      }),
    ).toBe("kuyruk");
  });

  it("hassas kategori slug'ı tanır", () => {
    expect(isHassasKategori("asayis")).toBe(true);
    expect(isHassasKategori("gundem")).toBe(false);
  });
});
