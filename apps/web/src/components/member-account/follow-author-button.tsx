"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberSession } from "@/hooks/use-member-session";
import {
  isFollowing,
  toggleFollow,
  type FollowedAuthor,
} from "@/lib/member-prefs";
import styles from "./member-actions.module.css";

export type FollowAuthorButtonProps = {
  slug: string;
  name: string;
  title?: string | null;
  avatarUrl?: string | null;
};

/** Yazar profilinde takip et / takipten çık */
export function FollowAuthorButton(props: FollowAuthorButtonProps) {
  const { isLoggedIn, ready } = useMemberSession();
  const [on, setOn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOn(isFollowing(props.slug));
    function sync() {
      setOn(isFollowing(props.slug));
    }
    window.addEventListener("yh-member-prefs", sync);
    return () => window.removeEventListener("yh-member-prefs", sync);
  }, [props.slug]);

  function onClick() {
    if (!ready) return;
    if (!isLoggedIn) {
      router.push(`/giris?next=${encodeURIComponent(`/yazar/${props.slug}`)}`);
      return;
    }
    const next = toggleFollow({
      slug: props.slug,
      name: props.name,
      title: props.title,
      avatarUrl: props.avatarUrl,
    } satisfies Omit<FollowedAuthor, "followedAt">);
    setOn(next.some((f) => f.slug === props.slug));
  }

  return (
    <button
      type="button"
      className={on ? styles.btnOn : styles.btn}
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? `${props.name} takipten çık` : `${props.name} takip et`}
    >
      {on ? "Takip ediliyor" : "Takip et"}
    </button>
  );
}
