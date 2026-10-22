import {
  Document,
  Font,
  G,
  Image,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { FONT_BASE64, LOGO } from "./assets.generated";
import { BRAND, CARD_H, CARD_W, CATEGORY_STYLE, PT_PER_MM, fitLine, fitName } from "./layout";

const dataUri = (b64: string) => `data:font/ttf;base64,${b64}`;
Font.register({
  family: "Inter",
  fonts: [
    { src: dataUri(FONT_BASE64.interRegular), fontWeight: 400 },
    { src: dataUri(FONT_BASE64.interSemiBold), fontWeight: 600 },
    { src: dataUri(FONT_BASE64.interBold), fontWeight: 700 },
  ],
});
Font.register({
  family: "NotoSansTamil",
  fonts: [
    { src: dataUri(FONT_BASE64.tamilRegular), fontWeight: 400 },
    { src: dataUri(FONT_BASE64.tamilBold), fontWeight: 600 },
    { src: dataUri(FONT_BASE64.tamilBold), fontWeight: 700 },
  ],
});
// Never hyphenate names or places.
Font.registerHyphenationCallback((word) => [word]);

/** Latin text in Inter; any Tamil character falls back to Noto Sans Tamil. */
const FONT = ["Inter", "NotoSansTamil"];

export type IdCardData = {
  registrationNo: string;
  fullName: string;
  /** under_11 | 11_to_18 | above_19 */
  category: string | null;
  gender: string | null;
  birthYear: number | null;
  native: string | null;
  mobileMasked: string;
  /** Date and city under the logo, e.g. "27 Dec 2026 · Chennai" (the logo already names the event). */
  eventLine: string;
  photo: { data: Buffer; format: "jpg" | "png" } | null;
  verifyUrl: string;
};

/** The Athangudi tile (brand kit) as one path covering the card, drawn very faintly. */
function tilePath(width: number, height: number, tile = 18) {
  const s = tile / 64;
  const parts: string[] = [];
  for (let y = -tile / 2; y < height + tile; y += tile) {
    for (let x = -tile / 2; x < width + tile; x += tile) {
      const p = (px: number, py: number) => `${(x + px * s).toFixed(2)} ${(y + py * s).toFixed(2)}`;
      parts.push(`M${p(32, 4)} L${p(60, 32)} L${p(32, 60)} L${p(4, 32)} Z`);
      parts.push(`M${p(32, 18)} L${p(46, 32)} L${p(32, 46)} L${p(18, 32)} Z`);
    }
  }
  return parts.join(" ");
}
const TILES = tilePath(CARD_W, CARD_H);

type LogoShape = (typeof LOGO.shapes)[number];

function LogoShapeEl({ s }: { s: LogoShape }) {
  if (s.type === "path") return <Path d={s.d} fill={s.fill} fillRule="evenodd" />;
  return <Rect x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} fill={s.fill} />;
}

/** The full logo (symbol + wordmark) as vector paths. */
function Logo({ width }: { width: number }) {
  const [, , vbW, vbH] = LOGO.viewBox.split(" ").map(Number);
  return (
    <Svg viewBox={LOGO.viewBox} style={{ width, height: (width * vbH) / vbW }}>
      <G transform={LOGO.transform}>
        {LOGO.shapes
          .filter((s) => s.inGroup)
          .map((s, i) => (
            <LogoShapeEl key={i} s={s} />
          ))}
      </G>
      {LOGO.shapes
        .filter((s) => !s.inGroup)
        .map((s, i) => (
          <LogoShapeEl key={i} s={s} />
        ))}
    </Svg>
  );
}

/** QR code drawn as vector squares (sharp at any print size). */
function Qr({ url, size }: { url: string; size: number }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const quiet = 2;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!qr.modules.get(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < n && qr.modules.get(r, c)) c++;
      d += `M${start + quiet} ${r + quiet}h${c - start}v1h${start - c}z`;
    }
  }
  return (
    <Svg viewBox={`0 0 ${n + 2 * quiet} ${n + 2 * quiet}`} style={{ width: size, height: size }}>
      <Rect x={0} y={0} width={n + 2 * quiet} height={n + 2 * quiet} fill="#ffffff" />
      <Path d={d} fill={BRAND.ink} />
    </Svg>
  );
}

/** Neutral head-and-shoulders silhouette when there's no photo. */
function Silhouette({ size }: { size: number }) {
  return (
    <Svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <Rect x={0} y={0} width={100} height={100} fill="#ece6d6" />
      <Path d="M50 22 a17 17 0 1 0 0.001 0 Z" fill="#cbbf9f" />
      <Path d="M16 100 C16 72 32 62 50 62 C68 62 84 72 84 100 Z" fill="#cbbf9f" />
    </Svg>
  );
}

const PHOTO = 66;
const RING = 2.2; // gap + ring around the photo
const LABEL = {
  fontFamily: FONT,
  fontSize: 4.6,
  fontWeight: 600,
  color: BRAND.muted,
  letterSpacing: 0.35,
} as const;
/** Room for a detail value: rows block minus the label column and a small gap before the QR. */
const VALUE_W = CARD_W - 18 - 36 - 34 - 3;
const VALUE = { fontFamily: FONT, fontSize: 6.2, fontWeight: 600, color: BRAND.ink } as const;

/** One card face, CARD_W × CARD_H, positioned by its parent. */
function CardFace({ c }: { c: IdCardData }) {
  const name = fitName(c.fullName);
  const category = (c.category && CATEGORY_STYLE[c.category]) || {
    label: "Open",
    color: BRAND.goldInk,
  };
  const rows: [string, string][] = [
    ["GENDER", c.gender ? c.gender[0].toUpperCase() + c.gender.slice(1) : "—"],
    ["BIRTH YEAR", c.birthYear ? String(c.birthYear) : "—"],
    ["NATIVE", c.native || "—"],
    ["MOBILE", c.mobileMasked],
  ];
  return (
    <View
      style={{ width: CARD_W, height: CARD_H, backgroundColor: BRAND.card, position: "relative" }}
    >
      <Svg
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: "absolute", top: 0, left: 0, width: CARD_W, height: CARD_H }}
      >
        <Path
          d={TILES}
          stroke={BRAND.goldInk}
          strokeWidth={0.35}
          fill="none"
          strokeOpacity={0.09}
        />
      </Svg>

      <View style={{ position: "absolute", top: 7, left: 0, width: CARD_W, alignItems: "center" }}>
        <Logo width={38} />
        <Text
          style={{
            marginTop: 3,
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 5,
            letterSpacing: 0.45,
            color: BRAND.ink,
            textAlign: "center",
          }}
        >
          {c.eventLine.toUpperCase()}
        </Text>
      </View>

      {/* Photo with a thin gold ring; face-centred crop (top-weighted, as passport photos are). */}
      <View
        style={{
          position: "absolute",
          top: 61,
          left: (CARD_W - PHOTO - 2 * RING) / 2,
          width: PHOTO + 2 * RING,
          height: PHOTO + 2 * RING,
          borderRadius: (PHOTO + 2 * RING) / 2,
          borderWidth: 1,
          borderColor: BRAND.gold,
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: PHOTO - 1,
            height: PHOTO - 1,
            borderRadius: (PHOTO - 1) / 2,
            overflow: "hidden",
          }}
        >
          {c.photo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image (PDF, not HTML)
            <Image
              src={c.photo}
              style={{
                width: PHOTO - 1,
                height: PHOTO - 1,
                borderRadius: (PHOTO - 1) / 2,
                objectFit: "cover",
                objectPosition: "50% 30%",
              }}
            />
          ) : (
            <Silhouette size={PHOTO - 1} />
          )}
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          top: 134,
          left: 9,
          width: CARD_W - 18,
          height: 27,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {name.lines.map((line, i) => (
          <Text
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: name.size,
              lineHeight: 1.08,
              color: BRAND.navy,
              textAlign: "center",
            }}
          >
            {line}
          </Text>
        ))}
      </View>

      <View
        style={{ position: "absolute", top: 163, left: 0, width: CARD_W, alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: category.color,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 6.2,
              color: "#ffffff",
              letterSpacing: 0.4,
            }}
          >
            {category.label.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={{ position: "absolute", top: 179, left: 9, width: CARD_W - 18 - 36, height: 30 }}
      >
        {rows.map(([label, value], i) => (
          <View
            key={label}
            style={{
              position: "absolute",
              top: i * 7.6,
              left: 0,
              width: CARD_W - 18 - 36,
              height: 7.6,
            }}
          >
            <Text style={{ ...LABEL, position: "absolute", top: 1.2, left: 0 }}>{label}</Text>
            {(() => {
              const fit = fitLine(value, VALUE_W);
              return (
                <Text
                  style={{
                    ...VALUE,
                    fontSize: fit.size,
                    position: "absolute",
                    top: (6.2 - fit.size) / 2,
                    left: 34,
                  }}
                >
                  {fit.text}
                </Text>
              );
            })()}
          </View>
        ))}
      </View>
      <View style={{ position: "absolute", top: 177, right: 8 }}>
        <Qr url={c.verifyUrl} size={32} />
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: CARD_W,
          height: 30,
          backgroundColor: BRAND.orange,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 6,
            letterSpacing: 0.9,
            color: "#ffffff",
            marginRight: 6,
          }}
        >
          REG NO
        </Text>
        <Text
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 0.3,
            color: "#ffffff",
          }}
        >
          {c.registrationNo}
        </Text>
      </View>
    </View>
  );
}

/** One card on its own page, exactly CR80 — for card printers or a single print at 100%. */
export function renderIdCardPdf(card: IdCardData) {
  return renderToBuffer(
    <Document title={`ID card ${card.registrationNo}`} author="Nagarathar's Chess Championship">
      <Page size={{ width: CARD_W, height: CARD_H }} style={{ margin: 0, padding: 0 }}>
        <CardFace c={card} />
      </Page>
    </Document>
  );
}

// A4 landscape: 5 columns × 2 rows of portrait CR80 cards = 10 per sheet.
const A4_W = 297 * PT_PER_MM;
const A4_H = 210 * PT_PER_MM;
const COLS = 5;
const ROWS = 2;
const SHEET_X = (A4_W - COLS * CARD_W) / 2;
const SHEET_Y = (A4_H - ROWS * CARD_H) / 2;

/** Crop marks in the margins, on every cut line (cards share their edges). */
function CropMarks() {
  const len = 14;
  const gap = 4;
  const xs = Array.from({ length: COLS + 1 }, (_, i) => SHEET_X + i * CARD_W);
  const ys = Array.from({ length: ROWS + 1 }, (_, i) => SHEET_Y + i * CARD_H);
  const top = SHEET_Y;
  const bottom = SHEET_Y + ROWS * CARD_H;
  const left = SHEET_X;
  const right = SHEET_X + COLS * CARD_W;
  let d = "";
  for (const x of xs)
    d += `M${x} ${top - gap - len}V${top - gap}M${x} ${bottom + gap}V${bottom + gap + len}`;
  for (const y of ys)
    d += `M${left - gap - len} ${y}H${left - gap}M${right + gap} ${y}H${right + gap + len}`;
  return (
    <Svg
      viewBox={`0 0 ${A4_W} ${A4_H}`}
      style={{ position: "absolute", top: 0, left: 0, width: A4_W, height: A4_H }}
    >
      <Path d={d} stroke="#000000" strokeWidth={0.5} fill="none" />
    </Svg>
  );
}

/** Many cards, 10 per A4 sheet with crop marks. Print at 100% ("Actual size"). */
export function renderIdCardSheetPdf(cards: IdCardData[]) {
  const pages: IdCardData[][] = [];
  for (let i = 0; i < cards.length; i += COLS * ROWS) pages.push(cards.slice(i, i + COLS * ROWS));
  return renderToBuffer(
    <Document title={`ID cards (${cards.length})`} author="Nagarathar's Chess Championship">
      {pages.map((pageCards, p) => (
        <Page key={p} size="A4" orientation="landscape" style={{ position: "relative" }}>
          <CropMarks />
          {pageCards.map((c, i) => (
            <View
              key={c.registrationNo}
              style={{
                position: "absolute",
                left: SHEET_X + (i % COLS) * CARD_W,
                top: SHEET_Y + Math.floor(i / COLS) * CARD_H,
              }}
            >
              <CardFace c={c} />
            </View>
          ))}
          <Text
            style={{
              position: "absolute",
              bottom: 12,
              left: 0,
              width: A4_W,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 6.5,
              color: "#555555",
            }}
          >
            Print at 100% (“Actual size”), not “Fit to page”. Cut along the marks. Sheet {p + 1} of{" "}
            {pages.length} · {cards.length} card
            {cards.length === 1 ? "" : "s"}
          </Text>
        </Page>
      ))}
    </Document>
  );
}
