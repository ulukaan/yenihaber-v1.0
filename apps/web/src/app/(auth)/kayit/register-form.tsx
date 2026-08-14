"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@yenihaber/ui";
import { RegisterSchema } from "@yenihaber/shared";
import { AuthShell } from "@/components/auth-shell/auth-shell";
import { clientApi, saveSession } from "@/lib/client-api";
import styles from "../auth-forms.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!accept) {
      setError("Devam etmek için kullanım koşullarını kabul edin.");
      return;
    }

    const parsed = RegisterSchema.safeParse({
      name,
      email,
      password,
      passwordConfirm,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      });
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await clientApi.auth.register(parsed.data);
      saveSession(res.token, res.user);
      router.push("/hesabim");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Üye Kayıt"
      subtitle="Ücretsiz hesap oluşturun, gündemi yakından takip edin."
      footer={
        <>
          Zaten hesabınız var mı? <Link href="/giris">Giriş yapın.</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Ad Soyad"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          helperText="Profilinizde görünecek isim"
          className={styles.softInput}
          required
        />
        <Input
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          className={styles.softInput}
          required
        />
        <Input
          label="Şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          helperText="En az 8 karakter kullanın"
          className={styles.softInput}
          required
        />
        <Input
          label="Şifre tekrar"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="Şifrenizi tekrar girin"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={fieldErrors.passwordConfirm}
          className={styles.softInput}
          required
        />

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
          />
          <span>
            <Link href="/kullanim-kosullari" className={styles.link}>
              Kullanım koşulları
            </Link>{" "}
            ve{" "}
            <Link href="/gizlilik" className={styles.link}>
              gizlilik politikasını
            </Link>{" "}
            okudum, kabul ediyorum.
          </span>
        </label>

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
          Hesap Oluştur
        </Button>
      </form>
    </AuthShell>
  );
}
