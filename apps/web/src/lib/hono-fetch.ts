import "server-only";
import { getApiApp } from "@yenihaber/api/app";

const INTERNAL_ORIGIN = "http://yenihaber.internal";

/**
 * Build/SSR sırasında Node `fetch("/api/v1/...")` çalışmaz.
 * Aynı süreçteki Hono uygulamasına gider.
 */
export function fetchViaHono(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const app = getApiApp();
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const absolute = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `${INTERNAL_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;
  const headers = new Headers(init?.headers);
  if (input instanceof Request) {
    input.headers.forEach((value, key) => {
      if (!headers.has(key)) headers.set(key, value);
    });
  }
  return app.fetch(new Request(absolute, { ...init, headers }));
}

export function internalApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${INTERNAL_ORIGIN}/api/v1${p}`;
}

export function fetchInternalApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetchViaHono(internalApiUrl(path), init);
}
