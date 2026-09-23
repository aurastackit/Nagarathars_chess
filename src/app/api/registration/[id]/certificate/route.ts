import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateRange } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age-category";
import { computeStandings, categoryWinners } from "@/lib/standings";
import { renderCertificatePdf, type CertificateKind } from "@/lib/certificate-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registration = await prisma.registration.findUnique({ where: { id }, include: { tournament: true } });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.status !== "confirmed" && registration.status !== "registered") {
    return NextResponse.json({ error: "This registration isn't confirmed" }, { status: 403 });
  }
  if (new Date() < registration.tournament.endDate) {
    return NextResponse.json({ error: "The certificate is available once the tournament concludes" }, { status: 403 });
  }

  let kind: CertificateKind = "participation";
  let categoryLabel: string | undefined;

  if (registration.tournament.resultsPublished && registration.playerId) {
    const [registrants, rounds] = await Promise.all([
      prisma.registration.findMany({
        where: { tournamentId: registration.tournamentId, status: { in: ["confirmed", "registered"] } },
        include: { player: true },
      }),
      prisma.round.findMany({ where: { tournamentId: registration.tournamentId }, include: { pairings: true } }),
    ]);
    const players = registrants
      .filter((r) => r.player)
      .map((r) => ({ id: r.player!.id, fullName: r.player!.fullName, ageCategory: r.ageCategory }));
    const standings = computeStandings(players, rounds.flatMap((r) => r.pairings));
    const mine = standings.find((s) => s.player.id === registration.playerId);
    const winners = categoryWinners(standings);

    if (mine?.rank === 1) {
      kind = "overall_winner";
    } else if (registration.ageCategory && winners[registration.ageCategory]?.player.id === registration.playerId) {
      kind = "category_winner";
      categoryLabel = ageCategoryLabel(registration.ageCategory);
    }
  }

  const pdf = await renderCertificatePdf({
    kind,
    categoryLabel,
    playerName: registration.fullName,
    tournamentTitle: registration.tournament.title,
    tournamentDateLabel: formatDateRange(registration.tournament.startDate, registration.tournament.endDate),
    venueLabel: `${registration.tournament.venue}, ${registration.tournament.city}`,
    registrationId: registration.id,
    issuedOn: formatDate(new Date()),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${registration.id}.pdf"`,
    },
  });
}
