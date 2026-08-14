/**
 * Basit e-posta gönderimi.
 * SMTP_* tanımlıysa ham TCP/LMTP yok; NODE_SMTP veya dış hook:
 * SMTP tanımlı değilse (veya gönderim başarısızsa) konsola yazar.
 *
 * Prod: SMTP_HOST + SMTP_USER/PASS + npm i nodemailer
 * veya MAIL_WEBHOOK_URL (POST JSON {to,subject,text,html})
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function siteName() {
  return (
    process.env.PUBLIC_SITE_NAME ||
    process.env.NEXT_PUBLIC_SITE_NAME ||
    "Düzce Radikal"
  );
}

export function siteOrigin(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** SMTP / webhook / log */
export async function sendMail(
  msg: MailMessage,
): Promise<{ ok: boolean; mode: string }> {
  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    `noreply@${siteOrigin().replace(/^https?:\/\//, "").split("/")[0] || "localhost"}`;

  const webhook = process.env.MAIL_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.MAIL_WEBHOOK_SECRET
            ? { authorization: `Bearer ${process.env.MAIL_WEBHOOK_SECRET}` }
            : {}),
        },
        body: JSON.stringify({
          from,
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
          html: msg.html ?? msg.text.replace(/\n/g, "<br/>"),
        }),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      return { ok: true, mode: "webhook" };
    } catch (e) {
      console.error("[mail] webhook hata:", e instanceof Error ? e.message : e);
    }
  }

  const host = process.env.SMTP_HOST?.trim();
  if (host) {
    try {
      // optional peer — may not be installed
      // @ts-expect-error optional dependency
      const nodemailer = await import("nodemailer");
      const createTransport =
        nodemailer.createTransport ?? nodemailer.default?.createTransport;
      if (!createTransport) throw new Error("nodemailer createTransport yok");
      const port = Number(process.env.SMTP_PORT || 587);
      const secure = process.env.SMTP_SECURE === "1" || port === 465;
      const transport = createTransport({
        host,
        port,
        secure,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });
      await transport.sendMail({
        from: `"${siteName()}" <${from}>`,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html ?? msg.text.replace(/\n/g, "<br/>"),
      });
      return { ok: true, mode: "smtp" };
    } catch (e) {
      console.error("[mail] SMTP hata:", e instanceof Error ? e.message : e);
    }
  }

  console.info(`[mail] ${msg.to} | ${msg.subject}\n${msg.text}`);
  return { ok: true, mode: "log" };
}

/** Üye haberinin yayına çıkması */
export async function sendArticlePublishedMail(opts: {
  to: string;
  name: string;
  title: string;
  slug: string;
}): Promise<void> {
  const url = `${siteOrigin()}/haber/${opts.slug}`;
  const subject = `Haberiniz yayınlandı: ${opts.title}`;
  const text = [
    `Merhaba ${opts.name},`,
    ``,
    `Gönderdiğiniz haber editör onayından geçti ve yayına alındı.`,
    ``,
    `Başlık: ${opts.title}`,
    `Bağlantı: ${url}`,
    ``,
    `Teşekkürler,`,
    siteName(),
  ].join("\n");
  const html = `
    <p>Merhaba <strong>${escapeHtml(opts.name)}</strong>,</p>
    <p>Gönderdiğiniz haber editör onayından geçti ve <strong>yayına alındı</strong>.</p>
    <p><strong>${escapeHtml(opts.title)}</strong></p>
    <p><a href="${escapeHtml(url)}">Haberi görüntüle</a></p>
    <p>Teşekkürler,<br/>${escapeHtml(siteName())}</p>
  `.trim();
  await sendMail({ to: opts.to, subject, text, html });
}

/** Personel davet */
export async function sendInviteMail(opts: {
  to: string;
  roleLabel: string;
  acceptUrl: string;
  expiresAt: Date;
}): Promise<void> {
  const subject = `${siteName()} panele davet`;
  const exp = opts.expiresAt.toLocaleString("tr-TR");
  const text = [
    `Merhaba,`,
    ``,
    `${siteName()} yönetim paneline davet edildiniz.`,
    `Rol: ${opts.roleLabel}`,
    `Bağlantı (7 gün geçerli, ${exp} tarihine kadar):`,
    opts.acceptUrl,
    ``,
    `Linke tıklayıp kendi şifrenizi oluşturun. Bu e-postayı siz istemediyseniz yok sayın.`,
  ].join("\n");
  const html = `
    <p>Merhaba,</p>
    <p><strong>${escapeHtml(siteName())}</strong> yönetim paneline davet edildiniz.</p>
    <p>Rol: <strong>${escapeHtml(opts.roleLabel)}</strong></p>
    <p><a href="${escapeHtml(opts.acceptUrl)}">Daveti kabul et ve şifre oluştur</a></p>
    <p style="color:#666;font-size:13px">Bağlantı 7 gün geçerlidir (${escapeHtml(exp)}).</p>
  `.trim();
  await sendMail({ to: opts.to, subject, text, html });
}

/** Şifre sıfırlama (kullanıcı unuttu veya admin tetikledi) */
export async function sendPasswordResetMail(opts: {
  to: string;
  name: string;
  resetUrl: string;
  expiresMinutes: number;
}): Promise<void> {
  const subject = `${siteName()} — şifre sıfırlama`;
  const text = [
    `Merhaba ${opts.name},`,
    ``,
    `Şifre sıfırlama talebi aldık. Aşağıdaki bağlantı ${opts.expiresMinutes} dakika geçerlidir:`,
    opts.resetUrl,
    ``,
    `Bu işlemi siz yapmadıysanız bu e-postayı yok sayın.`,
    siteName(),
  ].join("\n");
  const html = `
    <p>Merhaba <strong>${escapeHtml(opts.name)}</strong>,</p>
    <p>Şifre sıfırlama talebi aldık. Bağlantı <strong>${opts.expiresMinutes} dakika</strong> geçerlidir.</p>
    <p><a href="${escapeHtml(opts.resetUrl)}">Yeni şifre oluştur</a></p>
    <p style="color:#666;font-size:13px">Siz talep etmediyseniz yok sayın.</p>
  `.trim();
  await sendMail({ to: opts.to, subject, text, html });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
