import { createServer } from "node:http";
import { parse } from "node:url";

const port = Number(process.env.PORT || 3000);

let handle = null;
let apiListener = null;
let bootError = null;

function isApi(url) {
  return url === "/api/v1" || url.startsWith("/api/v1/") || url.startsWith("/api/v1?");
}

createServer((req, res) => {
  const url = req.url || "/";
  if (bootError) {
    const message = bootError instanceof Error ? bootError.stack || bootError.message : String(bootError);
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
    const next = (await import("next")).default;
    const nextApp = next({ dev: false, dir: "./apps/web" });
    await nextApp.prepare();
    handle = nextApp.getRequestHandler();
    console.log("Next hazır");
  } catch (error) {
    bootError = error;
    console.error("Next boot hatası", error);
    return;
  }

  try {
    const { register } = await import("node:module");
    const { pathToFileURL } = await import("node:url");
    register("tsx", pathToFileURL("./"));
    const { getRequestListener } = await import("@hono/node-server");
    const { apiApp } = await import("./apps/api/src/app.ts");
    apiListener = getRequestListener(apiApp.fetch);
    console.log("API hazır");
  } catch (error) {
    console.error("API yüklenemedi", error);
  }
})();
