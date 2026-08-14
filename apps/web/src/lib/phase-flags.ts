/**
 * Faz 1 yayını — Faz 3 yüzeyleri varsayılan kapalı.
 * Açmak için .env: NEXT_PUBLIC_FEATURE_STORIES=1 vb.
 */
export const phaseFlags = {
  stories: process.env.NEXT_PUBLIC_FEATURE_STORIES === "1",
  polls: process.env.NEXT_PUBLIC_FEATURE_POLLS === "1",
  elections: process.env.NEXT_PUBLIC_FEATURE_ELECTIONS === "1",
} as const;
