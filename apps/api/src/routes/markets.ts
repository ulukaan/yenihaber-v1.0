import { Hono } from "hono";
import { getMarketsSnapshot } from "../lib/markets.js";

export const marketRoutes = new Hono();

/**
 * Canlı döviz / altın / kripto
 * Kaynak: canlidoviz.com (type 0|1|2) + yedekler
 */
marketRoutes.get("/", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return c.json(data);
});

marketRoutes.get("/fx", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  return c.json({ items: data.fx, source: data.source, updatedAt: data.updatedAt });
});

marketRoutes.get("/gold", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  return c.json({
    items: data.gold,
    source: data.source,
    updatedAt: data.updatedAt,
  });
});

marketRoutes.get("/crypto", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getMarketsSnapshot(force);
  return c.json({
    items: data.crypto,
    source: data.source,
    updatedAt: data.updatedAt,
  });
});
