import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);

const standaloneCandidates = [
  join(rootDir, "apps/web/.next/standalone/apps/web/server.js"),
  join(rootDir, "apps/web/.next/standalone/server.js"),
];
const standalone = standaloneCandidates.find((p) => existsSync(p));

if (standalone) {
  process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
  process.env.PORT = String(port);
  console.log(`Standalone → ${standalone}`);
  await import(pathToFileURL(standalone).href);
} else {
  const webRequire = createRequire(join(rootDir, "apps/web/package.json"));
  let handle = null;
  let bootError = null;

  createServer((req, res) => {
    if (bootError) {
      const message =
        bootError instanceof Error
          ? bootError.stack || bootError.message
          : String(bootError);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(message);
      return;
    }
    if (handle) {
      void handle(req, res, parse(req.url || "/", true));
      return;
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("booting");
  }).listen(port, "0.0.0.0", () => {
    console.log(`Dinleniyor → :${port}`);
  });

  try {
    const next = webRequire("next");
    const nextApp = next({ dev: false, dir: join(rootDir, "apps/web") });
    await nextApp.prepare();
    handle = nextApp.getRequestHandler();
    console.log("Next hazır");
  } catch (error) {
    bootError = error;
    console.error("Next boot hatası", error);
  }
}
