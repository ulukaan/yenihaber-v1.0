import type { Metadata } from "next";
import { MemberFollows } from "@/components/member-account/member-follows";
import { MemberShell } from "@/components/member-account/member-shell";

export const metadata: Metadata = {
  title: "Takip",
};

export default function HesabimTakipPage() {
  return (
    <MemberShell
      title="Takip"
      description="Takip ettiğiniz yazarlar."
    >
      <MemberFollows />
    </MemberShell>
  );
}
