"use client";

import Link from "next/link";
import { FormEvent, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@yenihaber/ui";
import { LoginSchema, type Role } from "@yenihaber/shared";
import { AuthShell } from "@/components/auth-shell/auth-shell";
import { clientApi, saveSession } from "@/lib/client-api";
import { applyPostAuthNavigation, isStaffRole } from "@/lib/post-login";
import styles from "../auth-forms.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const n = searchParams.get("next");
    if (!n || !n.startsWith("/") || n.startsWith("//")) return null;
    return n;
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = LoginSchema.safeParse({ email, password });
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
      const res = await clientApi.auth.login(
        parsed.data.email,
        parsed.data.password,
      );
      saveSession(res.token, res.user, remember);
      const role = res.user.role as Role;
      if (nextPath && !isStaffRole(role)) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      applyPostAuthNavigation(
        role,
        (path) => {
          router.push(path);
          router.refresh();
        },
        res.token,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Üye Giriş"
      subtitle="Hesabınıza giriş yapın."
      footer={
        <>
          Üye kaydınız yok mu?{" "}
          <Link href="/kayit">Tıklayın Kayıt olun.</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Kullanıcı Adınız veya E-posta Adresiniz"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          className={styles.softInput}
          required
        />
        <Input
          label="Şifreniz"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          className={styles.softInput}
          required
        />

        <div className={styles.row}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Beni Hatırla
          </label>
          <Link href="/sifremi-unuttum" className={styles.link}>
            Şifremi unuttum?
          </Link>
        </div>

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
          Giriş Yap
        </Button>
      </form>
    </AuthShell>
  );
}
