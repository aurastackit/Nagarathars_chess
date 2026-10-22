import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { IdCardNotAvailable, idCardPdf } from "@/lib/id-card/cards";

export const dynamic = "force-dynamic";

/** One confirmed player's ID card (CR80 PDF). ?download=1 saves it instead of showing it. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const { pdf, card, cached } = await idCardPdf(id);
    const download = new URL(req.url).searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${card.registrationNo}-id-card.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Id-Card-Cache": cached ? "hit" : "miss",
      },
    });
  } catch (err) {
    if (err instanceof IdCardNotAvailable) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
