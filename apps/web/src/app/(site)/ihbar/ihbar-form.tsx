"use client";

import { API_BASE } from "@/lib/public-env";

import { FormEvent, useId, useState } from "react";
import { Send } from "lucide-react";
import styles from "./ihbar.module.css";

const API =
  API_BASE;

export type IhbarFormProps = {
  toEmail: string;
  siteName: string;
};

/** Haber ihbar formu — topic sabit: ihbar */
export function IhbarForm({ toEmail, siteName }: IhbarFormProps) {
  const baseId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errText, setErrText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const m = message.trim();
    if (m.length < 10) {
      setStatus("err");
      setErrText("Lütfen en az 10 karakterlik bir ihbar yazın.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrText("");

    const placeLine = place.trim() ? `Konum: ${place.trim()}` : null;
    const bodyParts = [placeLine, m].filter(Boolean).join("\n\n");

    try {
      const res = await fetch(`${API.replace(/\/$/, "")}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: anonymous ? "" : name.trim(),
          email: anonymous ? "" : email.trim(),
          topic: "ihbar",
          subject: place.trim()
            ? `İhbar — ${place.trim()}`
            : `İhbar — ${siteName}`,
          body: bodyParts,
          website,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
        } | null;
        throw new Error(
          j?.message || j?.error || "İhbar gönderilemedi. Tekrar deneyin.",
        );
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setPlace("");
      setMessage("");
      setAnonymous(false);
    } catch (err) {
      setStatus("err");
      setErrText(
        err instanceof Error ? err.message : "İhbar gönderilemedi.",
      );
      if (toEmail && m.length >= 10) {
        const s = place.trim()
          ? `İhbar — ${place.trim()}`
          : `İhbar — ${siteName}`;
        const mailBody = [
          placeLine,
          !anonymous && name.trim() ? `Gönderen: ${name.trim()}` : null,
          !anonymous && email.trim() ? `E-posta: ${email.trim()}` : null,
          anonymous ? "Anonim ihbar" : null,
          "",
          m,
        ]
          .filter((line) => line !== null)
          .join("\n");
        window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(mailBody)}`;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="ihbar-form"
      className={styles.form}
      onSubmit={(e) => void onSubmit(e)}
      noValidate
    >
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

      <div className={styles.field}>
        <label htmlFor={`${baseId}-msg`}>
          Ne oldu? <span className={styles.opt}>zorunlu</span>
        </label>
        <textarea
          id={`${baseId}-msg`}
          name="message"
          required
          rows={7}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === "err") setStatus("idle");
          }}
          placeholder="Olayı, yeri ve zamanı mümkün olduğunca net yazın. Belgeleriniz varsa WhatsApp’tan da iletebilirsiniz."
          aria-invalid={status === "err"}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${baseId}-place`}>
          Konum / mahalle{" "}
          <span className={styles.opt}>(isteğe bağlı)</span>
        </label>
        <input
          id={`${baseId}-place`}
          name="place"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Örn. Merkez, Konuralp…"
          autoComplete="address-level2"
        />
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        <span>
          Anonim kalsın — ad ve e-posta iletilmez; kaynak isterseniz gizli
          tutulur.
        </span>
      </label>

      {!anonymous ? (
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor={`${baseId}-name`}>
              Adınız <span className={styles.opt}>(isteğe bağlı)</span>
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
              E-posta <span className={styles.opt}>(isteğe bağlı)</span>
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
      ) : null}

      {status === "err" ? (
        <p className={styles.error} role="alert">
          {errText}
        </p>
      ) : null}
      {status === "ok" ? (
        <p className={styles.ok} role="status">
          İhbarınız alındı. Editör ekibi en kısa sürede inceler.
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submit}
        disabled={loading}
        aria-busy={loading}
      >
        <Send size={16} strokeWidth={2} aria-hidden />
        {loading ? "Gönderiliyor…" : "İhbarı gönder"}
      </button>
    </form>
  );
}
