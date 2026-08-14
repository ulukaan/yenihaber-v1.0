import { render, screen } from "@testing-library/react";
import { MobileTabBar } from "./mobile-tab-bar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("MobileTabBar", () => {
  it("dört sekme gösterir", () => {
    render(<MobileTabBar onMore={() => undefined} />);
    expect(screen.getByText("Anasayfa")).toBeInTheDocument();
    expect(screen.getByText("Son dakika")).toBeInTheDocument();
    expect(screen.getByText("Vefat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /daha/i })).toBeInTheDocument();
  });
});
