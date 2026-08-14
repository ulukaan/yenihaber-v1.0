"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberSession } from "@/hooks/use-member-session";
import { isSaved, toggleSaved } from "@/lib/member-prefs";
import styles from "./member-actions.module.css";

export type SaveArticleButtonProps = {
  slug: string;
  title: string;
  coverImage?: string | null;
  categoryName?: string | null;
};

/** Haber kaydet / kaldır */
export function SaveArticleButton(props: SaveArticleButtonProps) {
  const { isLoggedIn, ready } = useMemberSession();
  const [on, setOn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOn(isSaved(props.slug));
    function sync() {
      setOn(isSaved(props.slug));
    }
    window.addEventListener("yh-member-prefs", sync);
    return () => window.removeEventListener("yh-member-prefs", sync);
  }, [props.slug]);

  function onClick() {
    if (!ready) return;
    if (!isLoggedIn) {
      router.push(`/giris?next=${encodeURIComponent(`/haber/${props.slug}`)}`);
      return;
    }
    const next = toggleSaved({
      slug: props.slug,
      title: props.title,
      coverImage: props.coverImage,
      categoryName: props.categoryName,
    });
    setOn(next.some((a) => a.slug === props.slug));
  }

  return (
    <button
      type="button"
      className={on ? styles.btnOn : styles.btn}
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? "Kayıtlardan kaldır" : "Haberi kaydet"}
    >
      {on ? "Kayıtlı" : "Kaydet"}
    </button>
  );
}
