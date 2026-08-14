"use client";

import { API_BASE } from "@/lib/public-env";

import { FormEvent, useEffect, useId, useState } from "react";
import styles from "./contact-form.module.css";

type Props = {
  toEmail: string;
};

const API =
  API_BASE;

/** İletişim formu — panele mesaj kaydeder */
export function ContactForm({ toEmail }: Props) {
  const baseId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("genel");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errText, setErrText] = useState("");
  const [loading, setLoading] = useState(false);

  const topics: Record<string, string> = {
    genel: "Genel soru",
    ihbar: "Haber ihbarı",
    duzeltme: "Düzeltme talebi",
    reklam: "Reklam / iş birliği",
    kvkk: "KVKK başvurusu",
  };

  useEffect(() => {
    try {
      const konu = new URLSearchParams(window.location.search).get("konu");
      if (konu && topics[konu]) setTopic(konu);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const m = message.trim();
    if (m.length < 10) {
      setStatus("err");
      setErrText("Lütfen en az 10 karakterlik bir mesaj yazın.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrText("");
    try {
      const res = await fetch(`${API.replace(/\/$/, "")}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          subject: subject.trim(),
          body: m,
          website,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
        } | null;
        throw new Error(
          j?.message || j?.error || "Mesaj gönderilemedi. Tekrar deneyin.",
        );
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTopic("genel");
    } catch (err) {
      setStatus("err");
      setErrText(
        err instanceof Error ? err.message : "Mesaj gönderilemedi.",
      );
      // API yoksa e-posta yedeği
      if (toEmail && m.length >= 10) {
        const topicLabel = topics[topic] ?? "Genel";
        const s = subject.trim() || `${topicLabel} — Düzce Radikal`;
        const body = [
          `Konu türü: ${topicLabel}`,
          name.trim() ? `Gönderen: ${name.trim()}` : null,
          email.trim() ? `E-posta: ${email.trim()}` : null,
          "",
          m,
        ]
          .filter((line) => line !== null)
          .join("\n");
        window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(body)}`;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="form"
      className={styles.form}
      onSubmit={(e) => void onSubmit(e)}
      noValidate
    >
      {/* honeypot */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          opacity: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <label htmlFor={`${baseId}-web`}>Web site</label>
        <input
          id={`${baseId}-web`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-name`}>
            Adınız{" "}
            <span className={styles.opt}>(isteğe bağlı)</span>
          </label>
          <input
            id={`${baseId}-name`}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-email`}>
            E-posta{" "}
            <span className={styles.opt}>(isteğe bağlı)</span>
          </label>
          <input
            id={`${baseId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${baseId}-topic`}>Konu türü</label>
        <select
          id={`${baseId}-topic`}
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          aria-label="Konu türü"
        >
          {Object.entries(topics).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${baseId}-subject`}>
          Konu başlığı <span className={styles.opt}>(isteğe bağlı)</span>
        </label>
        <input
          id={`${baseId}-subject`}
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Kısa başlık"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${baseId}-message`}>Mesajınız</label>
        <textarea
          id={`${baseId}-message`}
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === "err") setStatus("idle");
          }}
          placeholder="En az 10 karakter"
          aria-describedby={`${baseId}-hint`}
          aria-invalid={status === "err"}
        />
        <span id={`${baseId}-hint`} className={styles.hint}>
          Mesajınız doğrudan editöre iletilir. En az 10 karakter yazın.
        </span>
      </div>

      {status === "err" ? (
        <p className={styles.error} role="alert">
          {errText || "Lütfen en az 10 karakterlik bir mesaj yazın."}
        </p>
      ) : null}
      {status === "ok" ? (
        <p className={styles.ok} role="status">
          Mesajınız alındı. En kısa sürede dönüş yapacağız.
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submit}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Gönderiliyor…" : "Mesajı gönder"}
      </button>
    </form>
  );
}
