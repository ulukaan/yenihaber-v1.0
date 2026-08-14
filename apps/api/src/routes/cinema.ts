import { Hono } from "hono";
import { getCinemaSnapshot } from "../lib/cinema.js";

export const cinemaRoutes = new Hono();

/**
 * GET /cinema — vizyondaki filmler (Beyazperde)
 */
cinemaRoutes.get("/", async (c) => {
  const force = c.req.query("refresh") === "1";
  const data = await getCinemaSnapshot(force);
  c.header(
    "Cache-Control",
    "public, max-age=1800, stale-while-revalidate=3600",
  );
  return c.json(data);
});
