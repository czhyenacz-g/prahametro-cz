import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "/uk" (ISO 639-1 kód jazyka) by byl duplicitní obsah k "/ua"
  // (skutečná URL, viz lib/i18n/types.ts a zadání) — trvalé přesměrování
  // místo indexovatelné duplicity.
  async redirects() {
    return [{ source: "/uk", destination: "/ua", permanent: true }];
  },
};

export default nextConfig;
