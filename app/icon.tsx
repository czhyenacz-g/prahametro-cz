import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Vlastní jednoduchý symbol — tři tečky v barvách linek A/B/C nad
// obloučkem (stopa/pin), žádné převzaté logo DPP/PID.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#1E8E3E" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F4B400" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#D93025" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
