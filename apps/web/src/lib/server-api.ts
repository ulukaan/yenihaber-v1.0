import "server-only";
import { createApiClient } from "@yenihaber/api-client";
import { fetchViaHono } from "@/lib/hono-fetch";

/** Sunucu bileşenleri — HTTP değil, süreç içi Hono */
export const publicApi = createApiClient({
  baseUrl: "http://yenihaber.internal/api/v1",
  fetch: fetchViaHono,
});
