"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ApiPoll, PollCreateInput } from "@yenihaber/shared";
import { ApiError } from "@yenihaber/api-client";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminEmpty } from "@/components/admin-page/admin-empty";
import { adminApi } from "@/lib/api";
import styles from "./polls.module.css";

type FormState = {
  question: string;
  type: "single" | "multi";
  status: "draft" | "active" | "closed";
  articleId: string;
  options: string[];
  startAt: string;
  endAt: string;
};

type ConflictBody = {
  conflict: true;
  message: string;
  activePoll: ApiPoll;
};

const emptyForm = (): FormState => ({
  question: "",
  type: "single",
  status: "draft",
  articleId: "",
  options: ["", ""],
  startAt: "",
  endAt: "",
});

function isConflict(body: unknown): body is ConflictBody {
  return Boolean(
    body &&
      typeof body === "object" &&
      "conflict" in body &&
      (body as ConflictBody).conflict === true,
  );
}

/** Anket paneli — genel / habere bağlı; tek genel aktif kuralı */
export default function PollsPage() {
  const [items, setItems] = useState<ApiPoll[]>([]);
  const [activeGeneralId, setActiveGeneralId] = useState<string | null>(null);
  const [articles, setArticles] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, arts] = await Promise.all([
        adminApi.polls.list(),
        adminApi.articles
          .list({ status: "YAYINDA", limit: 40, page: 1 })
          .catch(() => null),
      ]);
      setItems(res.data);
      setActiveGeneralId(res.activeGeneralId);
      if (arts?.data) {
        setArticles(arts.data.map((a) => ({ id: a.id, title: a.title })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function bodyFromForm(forceActive = false): PollCreateInput {
    return {
      question: form.question.trim(),
      type: form.type,
      status: form.status,
      articleId: form.articleId.trim() || null,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
      options: form.options
        .map((l) => l.trim())
        .filter(Boolean)
        .map((label) => ({ label })),
      forceActive,
    };
  }

  async function createPoll(forceActive = false) {
    setSaving(true);
    setError("");
    setOk("");
    try {
      const payload = bodyFromForm(forceActive);
      if (payload.question.length < 5) {
        setError("Soru en az 5 karakter");
        return;
      }
      if (payload.options.length < 2) {
        setError("En az 2 seçenek girin");
        return;
      }
      await adminApi.polls.create(payload);
      setOk("Anket oluşturuldu");
      setForm(emptyForm());
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && isConflict(e.body)) {
        const go = window.confirm(
          `${e.body.message}\n\nAktif: “${e.body.activePoll.question}”`,
        );
        if (go) {
          await createPoll(true);
          return;
        }
        return;
      }
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: ApiPoll["status"]) {
    setSaving(true);
    setError("");
    try {
      await adminApi.polls.update(id, { status, forceActive: false });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && isConflict(e.body)) {
        const go = window.confirm(
          `${e.body.message}\n\nAktif: “${e.body.activePoll.question}”`,
        );
        if (go) {
          await adminApi.polls.update(id, { status, forceActive: true });
          await load();
          return;
        }
        return;
      }
      setError(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Anket silinsin mi? Oylar da silinir.")) return;
    setSaving(true);
    try {
      await adminApi.polls.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <AdminPage
        title="Anketler"
        subtitle="Genel anket sağ kolonda “Günün anketi” olur (aynı anda bir tane). Habere bağlanırsa yalnızca o haberin altında çıkar."
      >
        <div className={styles.form}>
          <label className={styles.field}>
            <span>Soru</span>
            <input
              value={form.question}
              onChange={(e) =>
                setForm((f) => ({ ...f, question: e.target.value }))
              }
              placeholder="Düzce'de en acil sorun hangisi?"
              aria-label="Anket sorusu"
            />
          </label>

          <label className={styles.field}>
            <span>Habere bağla (boş = genel / sağ kolon)</span>
            <select
              value={form.articleId}
              onChange={(e) =>
                setForm((f) => ({ ...f, articleId: e.target.value }))
              }
              aria-label="Habere bağla"
            >
              <option value="">— Genel anket —</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title.slice(0, 80)}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Tür</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as FormState["type"],
                  }))
                }
              >
                <option value="single">Tek seçim</option>
                <option value="multi">Çoklu seçim</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Durum</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as FormState["status"],
                  }))
                }
              >
                <option value="draft">Taslak</option>
                <option value="active">Aktif</option>
                <option value="closed">Kapalı</option>
              </select>
            </label>
          </div>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Başlangıç (opsiyonel)</span>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startAt: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span>Bitiş (opsiyonel)</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endAt: e.target.value }))
                }
              />
            </label>
          </div>

          <div className={styles.opts}>
            {form.options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...form.options];
                  next[i] = e.target.value;
                  setForm((f) => ({ ...f, options: next }));
                }}
                placeholder={`Seçenek ${i + 1}`}
                aria-label={`Seçenek ${i + 1}`}
              />
            ))}
            {form.options.length < 8 ? (
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() =>
                  setForm((f) => ({ ...f, options: [...f.options, ""] }))
                }
              >
                + Seçenek
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={styles.primaryBtn}
            disabled={saving}
            onClick={() => void createPoll(false)}
          >
            <Plus size={16} aria-hidden />
            Anket kaydet
          </button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className={styles.ok} role="status">
            {ok}
          </p>
        ) : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        <ul className={styles.list}>
          {items.map((p) => {
            const isGeneralActive = activeGeneralId === p.id;
            return (
              <li key={p.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <span
                      className={
                        p.status === "active" ? styles.badgeOn : styles.badgeOff
                      }
                    >
                      {p.status === "active"
                        ? "Aktif"
                        : p.status === "closed"
                          ? "Kapalı"
                          : "Taslak"}
                      {isGeneralActive ? " · Günün anketi" : ""}
                      {p.articleId ? " · Habere bağlı" : " · Genel"}
                    </span>
                    <h2>{p.question}</h2>
                    <p className={styles.muted}>
                      {p.articleTitle
                        ? `Haber: ${p.articleTitle} · `
                        : null}
                      {p.totalVotes} oy · {p.type === "multi" ? "çoklu" : "tek"}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    {p.status !== "active" ? (
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => void setStatus(p.id, "active")}
                        disabled={saving}
                      >
                        Aktif et
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => void setStatus(p.id, "closed")}
                        disabled={saving}
                      >
                        Kapat
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      aria-label="Anketi sil"
                      onClick={() => void remove(p.id)}
                      disabled={saving}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <ul className={styles.bars}>
                  {p.options.map((o) => (
                    <li key={o.id}>
                      <div className={styles.barHead}>
                        <span>{o.label}</span>
                        <span>
                          {o.voteCount} · %{o.percent}
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${o.percent}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>

        {!loading && !items.length ? (
          <AdminEmpty
            title="Henüz anket yok"
            description="Yukarıdaki formu doldurarak ilk anketinizi oluşturun."
          />
        ) : null}
      </AdminPage>
    </AdminShell>
  );
}
