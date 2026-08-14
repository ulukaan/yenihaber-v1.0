"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@yenihaber/ui";
import { ResetPasswordSchema } from "@yenihaber/shared";
import { AuthShell } from "@/components/auth-shell/auth-shell";
import { clientApi } from "@/lib/client-api";
import styles from "../auth-forms.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Şifre sıfırla" subtitle="Yükleniyor…">
          <p className={styles.hint}>…</p>
        </AuthShell>
      }
    >
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");
    const parsed = ResetPasswordSchema.safeParse({
      token,
      password,
      passwordConfirm,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Geçersiz form");
      return;
    }
    setSubmitting(true);
    try {
      const res = await clientApi.auth.resetPassword(parsed.data);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Geçersiz link"
        subtitle="Sıfırlama bağlantısı eksik veya bozuk."
        footer={
          <>
            <Link href="/sifremi-unuttum">Yeni bağlantı iste</Link>
          </>
        }
      >
        <Button
          type="button"
          className={styles.submit}
          size="lg"
          onClick={() => router.push("/sifremi-unuttum")}
        >
          Şifremi unuttum
        </Button>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Şifre güncellendi" subtitle={success}>
        <Button
          type="button"
          className={styles.submit}
          size="lg"
          onClick={() => router.push("/giris")}
        >
          Giriş yap
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Yeni şifre oluştur"
      subtitle="Tek kullanımlık bağlantı — en az 8 karakter."
      footer={
        <>
          <Link href="/giris">Girişe dön</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Yeni şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError}
          required
          minLength={8}
          className={styles.softInput}
        />
        <Input
          label="Şifre tekrar"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          minLength={8}
          className={styles.softInput}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className={styles.submit}
          loading={submitting}
          size="lg"
        >
          Şifreyi kaydet
        </Button>
      </form>
    </AuthShell>
  );
}
