import type { Metadata } from "next";
import { MemberSaved } from "@/components/member-account/member-saved";
import { MemberShell } from "@/components/member-account/member-shell";

export const metadata: Metadata = {
  title: "Kaydettiklerim",
};

export default function HesabimHaberlerPage() {
  return (
    <MemberShell
      title="Kaydettiklerim"
      description="Okurken kaydettiğiniz haberler."
    >
      <MemberSaved />
    </MemberShell>
  );
}
