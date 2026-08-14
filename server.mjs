import { createServer } from "node:http";
import { createRequire, register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "node:url";

try {
  register("tsx/esm", import.meta.url);
} catch (error) {
  console.warn("tsx/esm register atlandı", error);
}

const rootDir = dirname(fileURLToPath(import.meta.url));
const webRequire = createRequire(join(rootDir, "apps/web/package.json"));
const port = Number(process.env.PORT || 3000);

let handle = null;
let apiListener = null;
let apiFailed = null;
let bootError = null;

function isApi(url) {
  return (
    url === "/api/v1" ||
    url.startsWith("/api/v1/") ||
    url.startsWith("/api/v1?")
  );
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

createServer((req, res) => {
  const url = req.url || "/";
  if (bootError) {
    const message =
      bootError instanceof Error
        ? bootError.stack || bootError.message
        : String(bootError);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(message);
    return;
  }
  if (isApi(url)) {
    if (apiListener) return apiListener(req, res);
    if (apiFailed) {
      sendJson(res, 503, {
        message: "API yüklenemedi. Sunucu günlüğüne bakın.",
      });
      return;
    }
    sendJson(res, 503, {
      message: "API başlatılıyor, birkaç saniye sonra tekrar deneyin.",
    });
    return;
  }
  if (handle) {
    void handle(req, res, parse(url, true));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("booting");
}).listen(port, "0.0.0.0", () => {
  console.log(`Dinleniyor → :${port}`);
});

void (async () => {
  try {
    const next = webRequire("next");
    const nextApp = next({ dev: false, dir: join(rootDir, "apps/web") });
    await nextApp.prepare();
    handle = nextApp.getRequestHandler();
    console.log("Next hazır");
  } catch (error) {
    bootError = error;
    console.error("Next boot hatası", error);
    return;
  }

  try {
    const { getRequestListener } = await import("@hono/node-server");
    const appHref = pathToFileURL(join(rootDir, "apps/api/src/app.ts")).href;
    const { apiApp } = await import(appHref);
    apiListener = getRequestListener(apiApp.fetch);
    console.log("API hazır");
  } catch (error) {
    apiFailed = error;
    console.error("API yüklenemedi", error);
  }
})();
