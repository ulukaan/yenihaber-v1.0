import type { Metadata } from "next";
import { MemberArticleSubmitPanel } from "@/components/member-account/member-article-submit";
import { MemberShell } from "@/components/member-account/member-shell";

export const metadata: Metadata = {
  title: "Haber Gönder",
};

export default function HaberGonderPage() {
  return (
    <MemberShell
      title="Haber Gönder"
      description="Haberi yazın; editör onayı sonrası yayına alınır, e-posta ile bilgilendirilirsiniz."
    >
      <MemberArticleSubmitPanel />
    </MemberShell>
  );
}
