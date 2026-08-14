import "./env.js";
import { serve } from "@hono/node-server";
import { loadApiEnv } from "@yenihaber/config";
import { apiApp } from "./app.js";

const env = loadApiEnv(process.env);
const port = Number(process.env.PORT || env.API_PORT);

serve({ fetch: apiApp.fetch, port }, (info) => {
  console.log(
    `API hazır → http://localhost:${info.port}/${env.API_PREFIX}/health`,
  );
});

/** Varsayılan kapak cache’ini DB’den ısıt */
void import("./lib/settings.js")
  .then((m) => m.loadSettingsFlat())
  .catch((e) => console.error("[boot] settings yüklenemedi", e));

/** Çöp yorumlar: 30 gün sonra kalıcı sil · günde bir */
async function runCommentTrashPurge() {
  try {
    const { purgeTrashedComments } = await import(
      "./lib/comment-moderation.js"
    );
    const n = await purgeTrashedComments(30);
    if (n > 0) console.log(`[cron] yorum çöpü: ${n} kayıt kalıcı silindi`);
  } catch (e) {
    console.error("[cron] yorum çöpü hatası", e);
  }
}
setTimeout(() => {
  void runCommentTrashPurge();
  setInterval(() => void runCommentTrashPurge(), 24 * 60 * 60 * 1000);
}, 2 * 60_000);

/** Süresi dolan reklamları arşivle · günde bir */
async function runAdArchive() {
  try {
    const { archiveExpiredAds } = await import("./lib/ads.js");
    const n = await archiveExpiredAds();
    if (n > 0) console.log(`[cron] reklam arşiv: ${n} kayıt`);
  } catch (e) {
    console.error("[cron] reklam arşiv hatası", e);
  }
}
setTimeout(() => {
  void runAdArchive();
  setInterval(() => void runAdArchive(), 24 * 60 * 60 * 1000);
}, 3 * 60_000);
