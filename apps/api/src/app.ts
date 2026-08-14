import "./env.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { loadApiEnv } from "@yenihaber/config";
import { authRoutes } from "./routes/auth.js";
import { articleRoutes } from "./routes/articles.js";
import { categoryRoutes } from "./routes/categories.js";
import { tagRoutes } from "./routes/tags.js";
import { redirectRoutes } from "./routes/redirects.js";
import { commentRoutes } from "./routes/comments.js";
import { reactionRoutes } from "./routes/reactions.js";
import { neighborRoutes } from "./routes/neighbors.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { settingsRoutes } from "./routes/settings.js";
import { mansetRoutes } from "./routes/manset.js";
import { authorRoutes } from "./routes/authors.js";
import { marketRoutes } from "./routes/markets.js";
import { prayerRoutes } from "./routes/prayer.js";
import { sportRoutes } from "./routes/sports.js";
import { cinemaRoutes } from "./routes/cinema.js";
import { userRoutes } from "./routes/users.js";
import { newsletterRoutes } from "./routes/newsletter.js";
import { mediaRoutes } from "./routes/media.js";
import { logRoutes } from "./routes/logs.js";
import { contactRoutes } from "./routes/contact.js";
import { adRoutes } from "./routes/ads.js";
import { pollRoutes } from "./routes/polls.js";
import { electionRoutes } from "./routes/elections.js";
import { menuRoutes } from "./routes/menus.js";
import { storyRoutes } from "./routes/stories.js";
import { listingRoutes } from "./routes/listings.js";

type ApiHono = Hono;

let cached: ApiHono | null = null;

/** İlk istekte ortam okunur — Next derlemesinde JWT/DB şart değil */
export function getApiApp(): ApiHono {
  if (cached) return cached;

  const env = loadApiEnv(process.env);
  const apiApp = new Hono().basePath(`/${env.API_PREFIX}`);

  const origins = env.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  apiApp.use(
    "*",
    cors({
      origin: origins.length
        ? origins
        : (origin) =>
            origin &&
            origin.startsWith("https://") &&
            !/localhost|127\.0\.0\.1/i.test(origin)
              ? origin
              : "",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  apiApp.get("/health", (c) => c.json({ ok: true, service: "yenihaber-api" }));

  apiApp.route("/auth", authRoutes);
  apiApp.route("/articles", articleRoutes);
  apiApp.route("/categories", categoryRoutes);
  apiApp.route("/tags", tagRoutes);
  apiApp.route("/redirects", redirectRoutes);
  apiApp.route("/media", mediaRoutes);
  apiApp.route("/comments", commentRoutes);
  apiApp.route("/reactions", reactionRoutes);
  apiApp.route("/neighbors", neighborRoutes);
  apiApp.route("/dashboard", dashboardRoutes);
  apiApp.route("/settings", settingsRoutes);
  apiApp.route("/manset", mansetRoutes);
  apiApp.route("/authors", authorRoutes);
  apiApp.route("/users", userRoutes);
  apiApp.route("/markets", marketRoutes);
  apiApp.route("/prayer", prayerRoutes);
  apiApp.route("/sports", sportRoutes);
  apiApp.route("/cinema", cinemaRoutes);
  apiApp.route("/newsletter", newsletterRoutes);
  apiApp.route("/logs", logRoutes);
  apiApp.route("/ads", adRoutes);
  apiApp.route("/contact", contactRoutes);
  apiApp.route("/polls", pollRoutes);
  apiApp.route("/elections", electionRoutes);
  apiApp.route("/menus", menuRoutes);
  apiApp.route("/stories", storyRoutes);
  apiApp.route("/listings", listingRoutes);

  apiApp.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ message: err.message }, err.status);
    }
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ZodError"
    ) {
      const zerr = err as {
        issues?: Array<{ path?: (string | number)[]; message?: string }>;
        errors?: Array<{ path?: (string | number)[]; message?: string }>;
      };
      const issues = zerr.issues ?? zerr.errors ?? [];
      const first = issues[0];
      const field = first?.path?.length ? first.path.join(".") : "";
      const msg = first?.message
        ? field
          ? `${field}: ${first.message}`
          : first.message
        : "Doğrulama hatası";
      return c.json(
        {
          message: msg,
          issues: issues.map((i) => ({
            path: i.path?.join(".") ?? "",
            message: i.message ?? "",
          })),
        },
        422,
      );
    }
    console.error(err);
    return c.json({ message: "Sunucu hatası" }, 500);
  });

  cached = apiApp;
  return apiApp;
}

export const apiApp = {
  fetch: (request: Request, env?: unknown, ctx?: unknown) =>
    getApiApp().fetch(request, env as never, ctx as never),
};
