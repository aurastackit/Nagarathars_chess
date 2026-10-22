import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl, isS3Configured } from "@/lib/s3";
import { normalizeStatus } from "@/lib/registration-status";
import { CATEGORY_STYLE } from "@/lib/id-card/layout";
import { VERIFY_TOKEN_PATTERN } from "@/lib/id-card/verify-token";

// Status can change at any time (withdrawn, rejected), so never serve a snapshot.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ID card check",
  robots: { index: false, follow: false },
};

async function findRegistration(token: string) {
  if (!VERIFY_TOKEN_PATTERN.test(token)) return null;
  return prisma.registration.findUnique({
    where: { verifyToken: token },
    select: {
      fullName: true,
      registrationNo: true,
      ageCategory: true,
      status: true,
      passportPhotoKey: true,
      passportPhotoData: true,
    },
  });
}

/**
 * Public page behind an ID card's QR code. Shows only what is printed on the
 * card's front — photo, name, category, registration number — and whether the
 * registration is currently confirmed.
 */
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reg = await findRegistration(token);
  const valid = reg ? normalizeStatus(reg.status) === "confirmed" : false;
  let photoUrl: string | null = null;
  if (reg?.passportPhotoKey && isS3Configured()) {
    try {
      photoUrl = await getDownloadUrl(reg.passportPhotoKey);
    } catch {
      photoUrl = null;
    }
  } else if (reg?.passportPhotoData?.startsWith("data:image/")) {
    // Rows from the old single-page form keep the photo inline.
    photoUrl = reg.passportPhotoData;
  }
  const category = reg?.ageCategory ? CATEGORY_STYLE[reg.ageCategory] : undefined;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-14 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">ID card check</p>
      {reg ? (
        <div className="mt-5 w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed S3 URL
            <img
              src={photoUrl}
              alt=""
              className="mx-auto h-28 w-28 rounded-full object-cover ring-2 ring-gold"
              style={{ objectPosition: "50% 30%" }}
            />
          ) : (
            <div className="mx-auto h-28 w-28 rounded-full bg-border/60 ring-2 ring-gold" />
          )}
          <h1 className="mt-4 text-xl font-bold text-charcoal">{reg.fullName}</h1>
          {category && (
            <span
              className="mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.label}
            </span>
          )}
          <p className="mt-3 font-mono text-sm text-muted">{reg.registrationNo ?? "—"}</p>
          <p
            data-testid="verify-status"
            className={`mt-5 rounded-xl px-4 py-3 text-lg font-bold ${
              valid ? "bg-success/10 text-success" : "bg-red-50 text-red-700"
            }`}
          >
            {valid ? "Valid" : "Not valid"}
          </p>
          {!valid && (
            <p className="mt-2 text-sm text-muted">This registration is not currently confirmed.</p>
          )}
        </div>
      ) : (
        <div className="mt-5 w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p
            data-testid="verify-status"
            className="rounded-xl bg-red-50 px-4 py-3 text-lg font-bold text-red-700"
          >
            Not valid
          </p>
          <p className="mt-2 text-sm text-muted">This ID card could not be found.</p>
        </div>
      )}
    </main>
  );
}
