import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { IdCardNotAvailable, MAX_SHEET_CARDS, idCardSheetPdf } from "@/lib/id-card/cards";

export const dynamic = "force-dynamic";

/** Selected players' ID cards on A4 sheets with crop marks (?ids=a,b,c — confirmed players only). */
export async function GET(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ids = [
    ...new Set((new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean)),
  ];
  if (ids.length > MAX_SHEET_CARDS) {
    return NextResponse.json(
      { error: `Print at most ${MAX_SHEET_CARDS} cards at a time` },
      { status: 400 }
    );
  }
  try {
    const { pdf, printed, skipped } = await idCardSheetPdf(ids);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="id-cards-${date}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Id-Cards": `${printed} printed, ${skipped} skipped`,
      },
    });
  } catch (err) {
    if (err instanceof IdCardNotAvailable) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
