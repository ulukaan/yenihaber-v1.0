/** @yenihaber/api ve @yenihaber/database yalnızca sunucu dosyalarında */
const serverOnly = [
  "src/app/api/**/*.{ts,tsx}",
  "src/lib/hono-fetch.ts",
  "src/lib/server-api.ts",
  "src/lib/member-auth.ts",
];

export default [
  { ignores: [".next/**", "node_modules/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@yenihaber/api", "@yenihaber/api/*", "@yenihaber/database"],
              message:
                "Sunucu paketi. Sadece route handler / server module içinde.",
            },
          ],
        },
      ],
    },
  },
  {
    files: serverOnly,
    rules: { "no-restricted-imports": "off" },
  },
];
