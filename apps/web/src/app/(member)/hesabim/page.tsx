import type { Metadata } from "next";
import { MemberHome } from "@/components/member-account/member-home";
import { MemberShell } from "@/components/member-account/member-shell";

export const metadata: Metadata = {
  title: "Hesap Paneli",
};

export default function HesabimPage() {
  return (
    <MemberShell
      title="Özet"
      description="Kayıtlı haberleriniz, takipleriniz ve gönderileriniz."
    >
      <MemberHome />
    </MemberShell>
  );
}
