import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatDateRange } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHARCOAL = "#17140f";
const GOLD = "#c8922f";
const IVORY = "#f6f1e7";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });

  const title = tournament?.title ?? "Nagarathar's Chess Championship";
  const dateLabel = tournament ? formatDateRange(tournament.startDate, tournament.endDate) : "";
  const venueLabel = tournament ? `${tournament.venue}, ${tournament.city}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          backgroundColor: CHARCOAL,
          color: IVORY,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "999px", backgroundColor: GOLD, display: "flex" }} />
          <div style={{ fontSize: "24px", letterSpacing: "2px", textTransform: "uppercase", color: GOLD, display: "flex" }}>
            Nagarathar&apos;s Chess Championship
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1.1, display: "flex", maxWidth: "1000px" }}>
            {title}
          </div>
          {dateLabel && (
            <div style={{ fontSize: "32px", color: IVORY, opacity: 0.85, display: "flex" }}>{dateLabel}</div>
          )}
          {venueLabel && (
            <div style={{ fontSize: "28px", color: GOLD, display: "flex" }}>{venueLabel}</div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
