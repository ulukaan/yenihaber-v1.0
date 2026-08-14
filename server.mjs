import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const webRequire = createRequire(join(rootDir, "apps/web/package.json"));
const port = Number(process.env.PORT || 3000);

let handle = null;
let apiListener = null;
let bootError = null;

function isApi(url) {
  return (
    url === "/api/v1" ||
    url.startsWith("/api/v1/") ||
    url.startsWith("/api/v1?")
  );
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
  if (apiListener && isApi(url)) {
    return apiListener(req, res);
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
    const { tsImport } = await import("tsx/esm/api");
    const { getRequestListener } = await import("@hono/node-server");
    const mod = await tsImport(
      pathToFileURL(join(rootDir, "apps/api/src/app.ts")).href,
      import.meta.url,
    );
    const app = mod.getApiApp ? mod.getApiApp() : mod.apiApp;
    apiListener = getRequestListener(app.fetch.bind(app));
    console.log("API hazır (tsx)");
  } catch (error) {
    console.error("API tsx yüklenemedi, Next /api/v1 kullanılacak", error);
  }
})();
