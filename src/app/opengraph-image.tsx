import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHARCOAL = "#17140f";
const GOLD = "#c8922f";
const IVORY = "#f6f1e7";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "28px",
          backgroundColor: CHARCOAL,
          color: IVORY,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "999px",
            backgroundColor: GOLD,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            textAlign: "center",
            maxWidth: "1000px",
            display: "flex",
          }}
        >
          Nagarathar&apos;s Chess Championship
        </div>
        <div
          style={{
            fontSize: "28px",
            color: GOLD,
            letterSpacing: "1px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Tournaments &middot; Coaching &middot; Community
        </div>
      </div>
    ),
    { ...size }
  );
}
