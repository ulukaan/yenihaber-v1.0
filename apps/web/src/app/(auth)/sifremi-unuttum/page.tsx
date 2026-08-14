import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Düzce Radikal şifre sıfırlama",
};

export default function SifremiUnuttumPage() {
  return <ForgotPasswordForm />;
}
