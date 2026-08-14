import type { Metadata } from "next";
import { MemberSettings } from "@/components/member-account/member-settings";
import { MemberShell } from "@/components/member-account/member-shell";

export const metadata: Metadata = {
  title: "Ayarlar",
};

export default function HesabimAyarlarPage() {
  return (
    <MemberShell
      title="Ayarlar"
      description="Hesap ve oturum tercihleriniz."
    >
      <MemberSettings />
    </MemberShell>
  );
}
