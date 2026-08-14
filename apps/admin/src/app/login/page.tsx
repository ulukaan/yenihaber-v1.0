"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@yenihaber/ui";
import { useAuth } from "@/components/auth-provider/auth-provider";
import { adminApi, setToken } from "@/lib/api";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <p className={styles.loading}>Yükleniyor…</p>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const inviteToken = sp.get("invite") ?? "";
  const resetToken = sp.get("reset") ?? "";

  const mode: "login" | "invite" | "reset" | "forgot" = inviteToken
    ? "invite"
    : resetToken
      ? "reset"
      : "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (!loading && user && mode === "login" && !forgotOpen) {
      router.replace("/dashboard");
    }
  }, [loading, user, router, mode, forgotOpen]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await adminApi.auth.acceptInvite({
        token: inviteToken,
        name: name.trim(),
        password,
        passwordConfirm,
      });
      setToken(res.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Davet kabul edilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await adminApi.auth.resetPassword({
        token: resetToken,
        password,
        passwordConfirm,
      });
      setOk(res.message);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sıfırlama başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setSubmitting(true);
    try {
      const res = await adminApi.auth.forgotPassword({
        email: forgotEmail.trim(),
      });
      setOk(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "invite") {
    return (
      <div className={styles.page}>
        <form className={styles.card} onSubmit={onInvite} noValidate>
          <div className={styles.head}>
            <span className={styles.mark} aria-hidden>
              DR
            </span>
            <h1>Daveti kabul et</h1>
            <p>Adınızı ve şifrenizi belirleyin</p>
          </div>
          <Input
            label="Ad soyad"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
          <Input
            label="Şifre"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="En az 8 karakter"
            required
            minLength={8}
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
          />
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            loading={submitting}
            variant="primary"
            className={styles.submit}
          >
            Hesabı etkinleştir
          </Button>
        </form>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className={styles.page}>
        <form className={styles.card} onSubmit={onReset} noValidate>
          <div className={styles.head}>
            <span className={styles.mark} aria-hidden>
              DR
            </span>
            <h1>Yeni şifre</h1>
            <p>Tek kullanımlık bağlantı ile şifrenizi oluşturun</p>
          </div>
          <Input
            label="Yeni şifre"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="En az 8 karakter"
            required
            minLength={8}
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
          />
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
          <Button
            type="submit"
            loading={submitting}
            variant="primary"
            className={styles.submit}
          >
            Şifreyi kaydet
          </Button>
        </form>
      </div>
    );
  }

  if (forgotOpen) {
    return (
      <div className={styles.page}>
        <form className={styles.card} onSubmit={onForgot} noValidate>
          <div className={styles.head}>
            <span className={styles.mark} aria-hidden>
              DR
            </span>
            <h1>Şifremi unuttum</h1>
            <p>E-postanıza tek kullanımlık sıfırlama linki gider</p>
          </div>
          <Input
            label="E-posta"
            name="email"
            type="email"
            autoComplete="username"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
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
          <Button
            type="submit"
            loading={submitting}
            variant="primary"
            className={styles.submit}
          >
            Sıfırlama bağlantısı gönder
          </Button>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => {
              setForgotOpen(false);
              setOk("");
              setError("");
            }}
          >
            Girişe dön
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onLogin} noValidate>
        <div className={styles.head}>
          <span className={styles.mark} aria-hidden>
            DR
          </span>
          <h1>Düzce Radikal</h1>
          <p>Yönetim paneline giriş</p>
        </div>
        <Input
          label="E-posta"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Şifre"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          loading={submitting}
          variant="primary"
          className={styles.submit}
        >
          Giriş Yap
        </Button>
        <button
          type="button"
          className={styles.textLink}
          onClick={() => setForgotOpen(true)}
        >
          Şifremi unuttum
        </button>
      </form>
    </div>
  );
}
