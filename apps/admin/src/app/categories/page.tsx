import { redirect } from "next/navigation";

/** Eski /categories → varsayılan kova */
export default function CategoriesIndexPage() {
  redirect("/categories/haber");
}
