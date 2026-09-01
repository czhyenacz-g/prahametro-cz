import type { MetroLine } from "./types.ts";

// Žlutá (B) má tmavý text, ostatní bílý — dostatečný kontrast (viz zadání).
export const LINE_BADGE_CLASS: Record<MetroLine, string> = {
  A: "bg-metro-a text-white",
  B: "bg-metro-b text-gray-900",
  C: "bg-metro-c text-white",
  D: "bg-metro-d text-white",
};

export const LINE_STROKE_CLASS: Record<MetroLine, string> = {
  A: "stroke-metro-a",
  B: "stroke-metro-b",
  C: "stroke-metro-c",
  D: "stroke-metro-d",
};

export const LINE_HEX: Record<MetroLine, string> = {
  A: "#1E8E3E",
  B: "#F4B400",
  C: "#D93025",
  D: "#6B4FBB",
};
