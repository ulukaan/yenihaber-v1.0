"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@yenihaber/ui";
import { ForgotPasswordSchema } from "@yenihaber/shared";
import { AuthShell } from "@/components/auth-shell/auth-shell";
import { clientApi } from "@/lib/client-api";
import styles from "../auth-forms.module.css";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");
    setSuccess("");

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Geçersiz e-posta");
      return;
    }

    setSubmitting(true);
    try {
      const res = await clientApi.auth.forgotPassword(parsed.data);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Şifremi Unuttum"
      subtitle="E-posta adresinizi yazın, sıfırlama bağlantısını gönderelim."
      footer={
        <>
          Şifrenizi hatırladınız mı? <Link href="/giris">Giriş yapın.</Link>
        </>
      }
    >
      {success ? (
        <div className={styles.form}>
          <p className={styles.success} role="status">
            {success}
          </p>
          <p className={styles.hint}>
            Gelen kutunuzu ve spam klasörünü kontrol edin. Bağlantı birkaç
            dakika içinde gelmezse tekrar deneyin.
          </p>
          <Button
            type="button"
            className={styles.submit}
            size="lg"
            onClick={() => router.push("/giris")}
          >
            Giriş sayfasına dön
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Input
            label="E-posta Adresiniz"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
            helperText="Kayıt olduğunuz e-posta adresini girin"
            className={styles.softInput}
            required
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
            Sıfırlama bağlantısı gönder
          </Button>

          <div className={styles.divider}>veya</div>

          <Button
            type="button"
            variant="outline"
            className={styles.secondary}
            onClick={() => router.push("/kayit")}
          >
            Yeni hesap oluştur
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
