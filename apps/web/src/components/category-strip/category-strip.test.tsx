import { render, screen } from "@testing-library/react";
import { CategoryStrip } from "./category-strip";

jest.mock("next/navigation", () => ({
  usePathname: () => "/kategori/gundem",
}));

describe("CategoryStrip", () => {
  it("aktif kategoriyi işaretler", () => {
    render(
      <CategoryStrip
        items={[
          {
            id: "1",
            label: "Gündem",
            href: "/kategori/gundem",
            accent: false,
          },
        ]}
      />,
    );
    expect(screen.getByText("Gündem").className).toMatch(/active/);
  });
});
