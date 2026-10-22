import { NextResponse } from "next/server";
import { IdCardNotAvailable, idCardPdf } from "@/lib/id-card/cards";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The player's own ID card (linked from the approval and reminder emails).
 * Same access as the registration status page and certificate: whoever has the
 * registration's link. Confirmed registrations only.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(`id-card:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }
  const { id } = await params;
  try {
    const { pdf, card } = await idCardPdf(id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${card.registrationNo}-id-card.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    if (err instanceof IdCardNotAvailable) {
      return NextResponse.json(
        { error: "The ID card is available once the registration is confirmed." },
        { status: 404 }
      );
    }
    throw err;
  }
}
