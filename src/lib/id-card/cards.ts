import "server-only";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getObjectBytes, putObjectBytes } from "@/lib/s3";
import { absoluteUrl } from "@/lib/site";
import { normalizeStatus } from "@/lib/registration-status";
import { eventLine, maskMobile } from "./layout";
import { renderIdCardPdf, renderIdCardSheetPdf, type IdCardData } from "./pdf";
import { newVerifyToken } from "./verify-token";

/** Bump when the card design changes, so every cached PDF is regenerated. */
const TEMPLATE_VERSION = 1;

/** Most cards one sheet request will render. */
export const MAX_SHEET_CARDS = 100;

export class IdCardNotAvailable extends Error {}

/**
 * The registration's verify token. Confirming sets it (registration-workflow);
 * this only covers a confirmed row that somehow has none, and never replaces one.
 */
async function ensureVerifyToken(registrationId: string, token: string | null) {
  if (token) return token;
  await prisma.registration.updateMany({
    where: { id: registrationId, verifyToken: null },
    data: { verifyToken: newVerifyToken() },
  });
  const row = await prisma.registration.findUniqueOrThrow({
    where: { id: registrationId },
    select: { verifyToken: true },
  });
  return row.verifyToken!;
}

/** Only JPG and PNG can go into the PDF; any other photo shows the placeholder. */
function photoFormat(key: string) {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "png" as const;
  if (ext === "jpg" || ext === "jpeg") return "jpg" as const;
  return null;
}

/** Rows from the old single-page form keep the photo inline as a data URL. */
function legacyPhoto(dataUrl: string | null) {
  const m = dataUrl?.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
  if (!m) return null;
  return { data: Buffer.from(m[2], "base64"), format: m[1] === "png" ? "png" : "jpg" } as const;
}

async function loadPhoto(registrationId: string, key: string | null, legacy: string | null) {
  if (!key) return legacyPhoto(legacy);
  const format = photoFormat(key);
  if (!format) return null;
  try {
    const data = await getObjectBytes(key);
    return data ? { data, format } : null;
  } catch (err) {
    console.error(`[id-card] photo for ${registrationId} unavailable:`, err);
    return null;
  }
}

/**
 * Card data for the confirmed registrations among `ids` (others are left out),
 * in registration-number order. Photos come from the private S3 bucket.
 */
export async function loadIdCards(ids: string[]) {
  const regs = await prisma.registration.findMany({
    where: { id: { in: ids } },
    include: { tournament: { select: { startDate: true, endDate: true, city: true } } },
    orderBy: { registrationNo: "asc" },
  });
  const confirmed = regs.filter((r) => normalizeStatus(r.status) === "confirmed");
  return Promise.all(
    confirmed.map(async (r) => {
      const photo = await loadPhoto(r.id, r.passportPhotoKey, r.passportPhotoData);
      const token = await ensureVerifyToken(r.id, r.verifyToken);
      const card: IdCardData = {
        registrationNo: r.registrationNo ?? r.id,
        fullName: r.fullName,
        category: r.ageCategory,
        gender: r.gender,
        birthYear: r.dob ? r.dob.getUTCFullYear() : null,
        native: r.native,
        mobileMasked: maskMobile(r.phone),
        eventLine: eventLine(r.tournament.startDate, r.tournament.endDate, r.tournament.city),
        photo,
        verifyUrl: absoluteUrl(`/verify/${token}`),
      };
      return { id: r.id, card, photoKey: photo ? (r.passportPhotoKey ?? "legacy") : null };
    })
  );
}

/**
 * One player's ID card. Cached in S3 under a hash of everything printed on it,
 * so a change to any detail, the photo or the design produces a fresh PDF.
 * If S3 can't be read or written the card is still rendered and served.
 */
export async function idCardPdf(registrationId: string) {
  const [entry] = await loadIdCards([registrationId]);
  if (!entry) throw new IdCardNotAvailable("ID card available after approval");
  const { photo, ...printed } = entry.card;
  const hash = createHash("sha256")
    .update(JSON.stringify({ v: TEMPLATE_VERSION, printed, photoKey: entry.photoKey }))
    .update(photo?.data ?? Buffer.alloc(0))
    .digest("hex")
    .slice(0, 24);
  const cacheKey = `id-cards/${registrationId}/${hash}.pdf`;

  try {
    const cached = await getObjectBytes(cacheKey);
    if (cached) return { pdf: cached, card: entry.card, cached: true };
  } catch (err) {
    console.error("[id-card] cache read failed:", err);
  }
  const pdf = await renderIdCardPdf(entry.card);
  try {
    await putObjectBytes(cacheKey, pdf, "application/pdf");
  } catch (err) {
    console.error("[id-card] cache write failed (card still served):", err);
  }
  return { pdf, card: entry.card, cached: false };
}

/** Several players' cards on A4 sheets, 10 per page; only confirmed players are printed. */
export async function idCardSheetPdf(ids: string[]) {
  const entries = await loadIdCards(ids.slice(0, MAX_SHEET_CARDS));
  if (entries.length === 0) {
    throw new IdCardNotAvailable("ID cards are available after approval");
  }
  const pdf = await renderIdCardSheetPdf(entries.map((e) => e.card));
  return { pdf, printed: entries.length, skipped: ids.length - entries.length };
}
