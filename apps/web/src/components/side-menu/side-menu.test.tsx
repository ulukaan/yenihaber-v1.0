import { render, screen } from "@testing-library/react";
import { SideMenu } from "./side-menu";

jest.mock("next/navigation", () => ({
  usePathname: () => "/kategori/gundem",
}));

jest.mock("@/hooks/use-member-session", () => ({
  useMemberSession: () => ({
    user: null,
    ready: true,
    isLoggedIn: false,
    refresh: () => undefined,
    logout: () => undefined,
  }),
}));

describe("SideMenu", () => {
  it("kategori satırlarını bölüm etiketi olmadan basar", () => {
    render(
      <SideMenu
        open
        categories={[{ name: "Gündem", slug: "gundem" }]}
        mainNav={[
          {
            id: "1",
            label: "Gündem",
            href: "/kategori/gundem",
            accent: false,
          },
        ]}
      />,
    );
    expect(screen.queryByText("KATEGORİLER")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gündem" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ara" })).toBeInTheDocument();
  });
});
