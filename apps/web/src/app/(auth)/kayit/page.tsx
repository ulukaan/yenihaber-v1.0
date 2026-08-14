import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Düzce Radikal üye kaydı",
};

export default function KayitPage() {
  return <RegisterForm />;
}
