import { Hono } from "hono";
import { getSportsSnapshot } from "../lib/sports";

export const sportRoutes = new Hono();

/**
 * Canlı skor / program / puan durumu
 * Kaynak: ESPN Süper Lig (+ diğer liglerde canlı)
 */
sportRoutes.get("/", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getSportsSnapshot(force);
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=45");
  return c.json(data);
});
