import { describe, expect, it } from "vitest";
import { listCities } from "@yenihaber/shared/prayer";

describe("prayer-city-picker", () => {
  it("81 ili Türkçe ada göre listeler", () => {
    const cities = listCities();
    expect(cities).toHaveLength(81);
    expect(cities.some((c) => c.slug === "duzce" && c.name === "Düzce")).toBe(
      true,
    );
    expect(cities[0]?.name.localeCompare(cities[1]?.name ?? "", "tr")).toBeLessThanOrEqual(
      0,
    );
  });
});
