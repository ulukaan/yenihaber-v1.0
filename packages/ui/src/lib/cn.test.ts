import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("çakışan class'ları birleştirir", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
