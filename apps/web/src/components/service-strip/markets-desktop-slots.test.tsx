import { describe, expect, it } from "vitest";
import { fxIconFor } from "./markets-desktop-slots";
import { DollarSign, Euro, PoundSterling } from "lucide-react";

describe("markets-desktop-slots", () => {
  it("EUR için euro ikonu kullanır", () => {
    expect(fxIconFor("EUR")).toBe(Euro);
    expect(fxIconFor("Euro")).toBe(Euro);
  });

  it("GBP için sterlin ikonu kullanır", () => {
    expect(fxIconFor("GBP")).toBe(PoundSterling);
  });

  it("USD için dolar ikonu kullanır", () => {
    expect(fxIconFor("USD")).toBe(DollarSign);
  });
});
