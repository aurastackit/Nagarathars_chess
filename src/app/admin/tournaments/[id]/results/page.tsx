import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Button } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { parseResultsCsv } from "@/lib/results-csv";
import { computeStandings } from "@/lib/standings";
import { getOrCreatePlayer } from "@/lib/player";
import { ageCategoryLabel } from "@/lib/age-category";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<string, string> = {
  "1-0": "1 – 0 (White wins)",
  "0-1": "0 – 1 (Black wins)",
  "0.5-0.5": "½ – ½ (Draw)",
  BYE: "Bye",
};

export default async function TournamentResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; imported?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { error, imported } = await searchParams;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: { where: { status: { in: ["confirmed", "registered"] } } },
    },
  });
  if (!tournament) notFound();

  // Backfill playerId for confirmed registrations created before this feature existed.
  const missingPlayer = tournament.registrations.filter((r) => !r.playerId);
  for (const r of missingPlayer) {
    const player = await getOrCreatePlayer({ email: r.email, fullName: r.fullName, dob: r.dob });
    await prisma.registration.update({ where: { id: r.id }, data: { playerId: player.id } });
  }

  const registrants = await prisma.registration.findMany({
    where: { tournamentId: id, status: { in: ["confirmed", "registered"] } },
    include: { player: true },
    orderBy: { fullName: "asc" },
  });

  const rounds = await prisma.round.findMany({
    where: { tournamentId: id },
    orderBy: { number: "asc" },
    include: {
      pairings: {
        include: { whitePlayer: true, blackPlayer: true },
        orderBy: { board: "asc" },
      },
    },
  });

  const allPairings = rounds.flatMap((r) => r.pairings);
  const playersInStandings = registrants
    .filter((r) => r.player)
    .map((r) => ({ id: r.player!.id, fullName: r.player!.fullName, ageCategory: r.ageCategory }));
  const standings = computeStandings(playersInStandings, allPairings);

  async function addRound(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const number = Number(formData.get("number"));
    if (!Number.isInteger(number) || number < 1) {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent("Enter a valid round number")}`);
    }
    const round = await prisma.round.create({ data: { tournamentId: id, number } }).catch(() => null);
    if (!round) {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent(`Round ${number} already exists`)}`);
    }
    await logAdminAction({
      actorEmail: session.user!.email!,
      action: "tournament.update",
      targetType: "Tournament",
      targetId: id,
      summary: `Added round ${number} for "${tournament!.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}/results`);
  }

  async function addPairing(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const roundId = String(formData.get("roundId") ?? "");
    const board = formData.get("board") ? Number(formData.get("board")) : null;
    const whitePlayerId = String(formData.get("whitePlayerId") ?? "");
    const blackPlayerId = String(formData.get("blackPlayerId") ?? "");
    const result = String(formData.get("result") ?? "");

    if (!roundId || !whitePlayerId || !result) {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent("Fill in white player and result")}`);
    }
    const isBye = blackPlayerId === "" || blackPlayerId === "BYE";
    if (isBye && result !== "BYE") {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent("A pairing with no black player must use result BYE")}`);
    }

    await prisma.pairing.create({
      data: {
        roundId,
        board,
        whitePlayerId,
        blackPlayerId: isBye ? null : blackPlayerId,
        result: result || null,
      },
    });
    await logAdminAction({
      actorEmail: session.user!.email!,
      action: "tournament.update",
      targetType: "Tournament",
      targetId: id,
      summary: `Recorded a pairing result for "${tournament!.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}/results`);
  }

  async function deletePairing(pairingId: string) {
    "use server";
    const session = await requireAdminPage();
    await prisma.pairing.delete({ where: { id: pairingId } });
    await logAdminAction({
      actorEmail: session.user!.email!,
      action: "tournament.update",
      targetType: "Tournament",
      targetId: id,
      summary: `Deleted a pairing for "${tournament!.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}/results`);
  }

  async function togglePublish() {
    "use server";
    const session = await requireAdminPage();
    const current = await prisma.tournament.findUnique({ where: { id }, select: { resultsPublished: true, title: true } });
    if (!current) return;
    await prisma.tournament.update({ where: { id }, data: { resultsPublished: !current.resultsPublished } });
    await logAdminAction({
      actorEmail: session.user!.email!,
      action: current.resultsPublished ? "tournament.unpublish" : "tournament.publish",
      targetType: "Tournament",
      targetId: id,
      summary: `${current.resultsPublished ? "Unpublished" : "Published"} results for "${current.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}/results`);
    revalidatePath(`/tournaments/${tournament!.slug}/results`);
  }

  async function importCsv(formData: FormData) {
    "use server";
    const session = await requireAdminPage();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent("Choose a CSV file")}`);
    }
    const text = await file!.text();
    const { rows, errors } = parseResultsCsv(text);
    if (errors.length > 0) {
      redirect(`/admin/tournaments/${id}/results?error=${encodeURIComponent(errors.slice(0, 3).join("; "))}`);
    }

    const regs = await prisma.registration.findMany({
      where: { tournamentId: id, status: { in: ["confirmed", "registered"] } },
      include: { player: true },
    });
    const playerByEmail = new Map(regs.filter((r) => r.player).map((r) => [r.email.trim().toLowerCase(), r.player!]));

    const importErrors: string[] = [];
    let created = 0;
    for (const row of rows) {
      const white = playerByEmail.get(row.whiteEmail);
      const black = row.blackEmail ? playerByEmail.get(row.blackEmail) : null;
      if (!white) {
        importErrors.push(`Round ${row.round}: no confirmed registrant with email ${row.whiteEmail}`);
        continue;
      }
      if (row.blackEmail && !black) {
        importErrors.push(`Round ${row.round}: no confirmed registrant with email ${row.blackEmail}`);
        continue;
      }
      const round = await prisma.round.upsert({
        where: { tournamentId_number: { tournamentId: id, number: row.round } },
        update: {},
        create: { tournamentId: id, number: row.round },
      });
      await prisma.pairing.create({
        data: {
          roundId: round.id,
          board: row.board,
          whitePlayerId: white.id,
          blackPlayerId: black?.id ?? null,
          result: row.result,
        },
      });
      created++;
    }

    if (importErrors.length > 0) {
      redirect(
        `/admin/tournaments/${id}/results?error=${encodeURIComponent(`Imported ${created}, skipped ${importErrors.length}: ${importErrors.slice(0, 3).join("; ")}`)}`
      );
    }

    await logAdminAction({
      actorEmail: session.user!.email!,
      action: "tournament.update",
      targetType: "Tournament",
      targetId: id,
      summary: `Imported ${created} pairing(s) from CSV for "${tournament!.title}"`,
    });
    revalidatePath(`/admin/tournaments/${id}/results`);
    redirect(`/admin/tournaments/${id}/results?imported=${created}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Results — {tournament.title}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {tournament.resultsPublished ? "Results are live on the public site." : "Results are not public yet."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/tournaments/${id}`} className="text-sm font-semibold text-charcoal hover:underline">
            Back to tournament
          </Link>
          <form action={togglePublish}>
            <Button type="submit" variant={tournament.resultsPublished ? "outline" : "primary"}>
              {tournament.resultsPublished ? "Unpublish results" : "Publish results"}
            </Button>
          </form>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {imported && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Imported {imported} pairing(s).
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-charcoal">Add a round</h2>
          <form action={addRound} className="mt-3 flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Round number</label>
              <input
                type="number"
                name="number"
                min={1}
                required
                className="w-24 rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit">Add round</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-charcoal">Import results (CSV)</h2>
          <p className="mt-1 text-xs text-foreground/50">
            Columns: round,board,white_email,black_email,result. Result is one of 1-0, 0-1, 0.5-0.5, BYE (leave
            black_email empty for a bye).
          </p>
          <form action={importCsv} className="mt-3 flex items-end gap-3">
            <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
            <Button type="submit">Import</Button>
          </form>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Rounds &amp; pairings</h2>
        {rounds.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">No rounds yet — add one above.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {rounds.map((round) => (
              <Card key={round.id} className="p-5">
                <h3 className="font-semibold text-charcoal">Round {round.number}</h3>
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-foreground/50">
                    <tr>
                      <th className="py-1.5 pr-3 font-medium">Board</th>
                      <th className="py-1.5 pr-3 font-medium">White</th>
                      <th className="py-1.5 pr-3 font-medium">Black</th>
                      <th className="py-1.5 pr-3 font-medium">Result</th>
                      <th className="py-1.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {round.pairings.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="py-1.5 pr-3">{p.board ?? "—"}</td>
                        <td className="py-1.5 pr-3">{p.whitePlayer?.fullName ?? "—"}</td>
                        <td className="py-1.5 pr-3">{p.blackPlayer?.fullName ?? "Bye"}</td>
                        <td className="py-1.5 pr-3">{p.result ? RESULT_LABEL[p.result] ?? p.result : "—"}</td>
                        <td className="py-1.5">
                          <form action={deletePairing.bind(null, p.id)}>
                            <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {round.pairings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-foreground/40">
                          No pairings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <form action={addPairing} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                  <input type="hidden" name="roundId" value={round.id} />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/60">Board</label>
                    <input type="number" name="board" min={1} className="w-16 rounded-md border border-border bg-card px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/60">White</label>
                    <select name="whitePlayerId" required className="rounded-md border border-border bg-card px-2 py-1.5 text-sm">
                      <option value="">Select player</option>
                      {registrants.map((r) => (
                        <option key={r.id} value={r.player?.id}>
                          {r.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/60">Black</label>
                    <select name="blackPlayerId" className="rounded-md border border-border bg-card px-2 py-1.5 text-sm">
                      <option value="">Bye</option>
                      {registrants.map((r) => (
                        <option key={r.id} value={r.player?.id}>
                          {r.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/60">Result</label>
                    <select name="result" required className="rounded-md border border-border bg-card px-2 py-1.5 text-sm">
                      <option value="1-0">1 – 0</option>
                      <option value="0.5-0.5">½ – ½</option>
                      <option value="0-1">0 – 1</option>
                      <option value="BYE">Bye</option>
                    </select>
                  </div>
                  <Button type="submit" className="!px-4 !py-1.5 text-xs">
                    Add pairing
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Standings preview</h2>
        <Card className="mt-4 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-charcoal/5 text-foreground/60">
              <tr>
                <th className="px-4 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">Player</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Played</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Buchholz</th>
                <th className="px-4 py-2 font-medium">Sonneborn-Berger</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.player.id} className="border-t border-border">
                  <td className="px-4 py-2 font-semibold">{s.rank}</td>
                  <td className="px-4 py-2">{s.player.fullName}</td>
                  <td className="px-4 py-2">{ageCategoryLabel(s.player.ageCategory)}</td>
                  <td className="px-4 py-2">{s.played}</td>
                  <td className="px-4 py-2 font-semibold">{s.score}</td>
                  <td className="px-4 py-2">{s.buchholz}</td>
                  <td className="px-4 py-2">{s.sonnebornBerger}</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-foreground/50">
                    No results recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
