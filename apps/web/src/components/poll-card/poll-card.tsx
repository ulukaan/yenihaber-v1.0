"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import type { ApiPoll } from "@yenihaber/shared";
import { createApiClient } from "@yenihaber/api-client";
import styles from "./poll-card.module.css";

const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  getToken: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("yh_token") ||
        localStorage.getItem("yh_member_token") ||
        localStorage.getItem("yh_admin_token")
      : null,
});

function lsKey(pollId: string) {
  return `yh_poll_voted_${pollId}`;
}

function formatVotes(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n);
}

function hasLocalVote(pollId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(lsKey(pollId)));
  } catch {
    return false;
  }
}

export type PollCardProps = {
  poll: ApiPoll | null;
  variant?: "rail" | "inline";
  className?: string;
};

/** Günün anketi — POST oy, yenilemesiz sonuç, localStorage hafıza */
export function PollCard({
  poll: initial,
  variant = "rail",
  className = "",
}: PollCardProps) {
  const baseId = useId();
  const [poll, setPoll] = useState<ApiPoll | null>(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"vote" | "results">("vote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPoll(initial);
  }, [initial]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!poll?.id || !mounted) return;
    try {
      const raw = localStorage.getItem(lsKey(poll.id));
      if (raw) {
        setMode("results");
        try {
          const j = JSON.parse(raw) as { optionId?: string };
          if (j.optionId) setVotedOptionId(j.optionId);
        } catch {
          /* mark only */
        }
      }
    } catch {
      /* ignore */
    }
  }, [poll?.id, mounted]);

  const isMulti = poll?.type === "multi";
  const canVote = Boolean(poll?.isOpen);

  const title = useMemo(() => {
    if (mode === "results" && votedOptionId) return "Oyunuz alındı";
    if (mode === "results") return "Anket sonuçları";
    return "Günün anketi";
  }, [mode, votedOptionId]);

  const toggle = useCallback(
    (id: string) => {
      if (isMulti) {
        setSelected((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
      } else {
        setSelected([id]);
      }
      setError("");
    },
    [isMulti],
  );

  async function submit() {
    if (!poll || !selected.length) {
      setError("Bir seçenek işaretleyin");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await client.polls.vote(poll.id, { optionIds: selected });
      if (res.poll) setPoll(res.poll);
      setVotedOptionId(selected[0] ?? null);
      setMode("results");
      try {
        localStorage.setItem(
          lsKey(poll.id),
          JSON.stringify({
            optionId: selected[0],
            at: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oy kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  if (!poll) return null;

  const rootCls = [
    styles.card,
    variant === "inline" ? styles.inline : styles.rail,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const alreadyVoted = mounted && hasLocalVote(poll.id);

  return (
    <section
      className={rootCls}
      aria-labelledby={`${baseId}-title`}
      data-poll-id={poll.id}
    >
      <header className={styles.head}>
        <p
          id={`${baseId}-title`}
          className={
            mode === "results" && votedOptionId
              ? `${styles.kicker} ${styles.kickerOk}`
              : styles.kicker
          }
        >
          <i className={styles.kickerDot} aria-hidden />
          {title}
        </p>
        <Link href="/anketler" className={styles.archiveLink}>
          Arşiv
        </Link>
      </header>

      <h2 className={styles.question}>{poll.question}</h2>

      {mode === "vote" && canVote ? (
        <ul className={styles.options} role={isMulti ? "group" : "radiogroup"}>
          {poll.options.map((o) => {
            const on = selected.includes(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className={on ? styles.optOn : styles.opt}
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  disabled={busy}
                >
                  <span
                    className={on ? styles.radioOn : styles.radio}
                    aria-hidden
                  />
                  <span>{o.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className={styles.results}>
          {poll.options.map((o) => {
            const mine = votedOptionId === o.id;
            return (
              <li key={o.id} className={mine ? styles.resMine : undefined}>
                <div className={styles.resHead}>
                  <span>{o.label}</span>
                  <strong>%{o.percent}</strong>
                </div>
                <div className={styles.track} aria-hidden>
                  <div
                    className={mine ? styles.fillOn : styles.fill}
                    style={{ width: `${Math.min(100, o.percent)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <footer className={styles.foot}>
        {mode === "vote" && canVote ? (
          <>
            <button
              type="button"
              className={styles.voteBtn}
              onClick={() => void submit()}
              disabled={busy || !selected.length}
              aria-busy={busy}
            >
              {busy ? "Gönderiliyor…" : "Oy ver"}
            </button>
            <div className={styles.meta}>
              <span>{formatVotes(poll.totalVotes)} oy</span>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setMode("results")}
              >
                Sonuçları gör
              </button>
            </div>
          </>
        ) : (
          <div className={styles.meta}>
            <span>{formatVotes(poll.totalVotes)} oy</span>
            {poll.daysLeft != null ? (
              <span>
                {poll.daysLeft === 0
                  ? "Sona erdi"
                  : `${poll.daysLeft} gün kaldı`}
              </span>
            ) : !canVote ? (
              <span>Kapandı</span>
            ) : !alreadyVoted ? (
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setMode("vote")}
              >
                Oylamaya dön
              </button>
            ) : null}
          </div>
        )}
      </footer>
    </section>
  );
}

/** Genel aktif anket (sağ kolon) */
export function SitePollCard({
  poll: initial,
  variant = "rail",
  className,
}: {
  poll?: ApiPoll | null;
  variant?: "rail" | "inline";
  className?: string;
}) {
  const [poll, setPoll] = useState<ApiPoll | null>(initial ?? null);

  useEffect(() => {
    if (initial !== undefined) {
      setPoll(initial);
      return;
    }
    let cancelled = false;
    void client.polls
      .active()
      .then((r) => {
        if (!cancelled) setPoll(r.poll);
      })
      .catch(() => {
        if (!cancelled) setPoll(null);
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  if (!poll) return null;
  return <PollCard poll={poll} variant={variant} className={className} />;
}

/** Habere bağlı anket */
export function ArticlePollCard({
  articleId,
  initial,
  variant = "inline",
  className,
}: {
  articleId: string;
  initial?: ApiPoll | null;
  variant?: "rail" | "inline";
  className?: string;
}) {
  const [poll, setPoll] = useState<ApiPoll | null>(initial ?? null);

  useEffect(() => {
    if (initial !== undefined) {
      setPoll(initial);
      return;
    }
    let cancelled = false;
    void client.polls
      .byArticle(articleId)
      .then((r) => {
        if (!cancelled) setPoll(r.poll);
      })
      .catch(() => {
        if (!cancelled) setPoll(null);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, initial]);

  if (!poll) return null;
  return <PollCard poll={poll} variant={variant} className={className} />;
}
