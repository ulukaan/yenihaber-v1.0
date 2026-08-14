import { Hono } from "hono";
import {
  DEFAULT_CITY_SLUG,
  getPrayerTimes,
  listCities,
} from "../lib/prayer.js";

export const prayerRoutes = new Hono();

/** İl listesi */
prayerRoutes.get("/cities", (c) => {
  return c.json({ cities: listCities(), defaultCity: DEFAULT_CITY_SLUG });
});

/**
 * Namaz vakitleri
 * GET /prayer?city=duzce
 */
prayerRoutes.get("/", async (c) => {
  const city = c.req.query("city") ?? DEFAULT_CITY_SLUG;
  const force = c.req.query("refresh") === "1";
  const data = await getPrayerTimes(city, force);
  c.header("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return c.json(data);
});
