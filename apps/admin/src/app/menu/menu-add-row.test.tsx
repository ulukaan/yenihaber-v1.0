import { render, screen } from "@testing-library/react";
import { AddItemRow } from "./menu-add-row";

describe("AddItemRow", () => {
  it("tıklanınca kaynak seçeneklerini açar", () => {
    const onAdd = jest.fn();
    render(<AddItemRow onAdd={onAdd} />);
    screen.getByRole("button", { name: /öğe ekle/i }).click();
    expect(screen.getByRole("menuitem", { name: /kategori/i })).toBeTruthy();
  });
});
