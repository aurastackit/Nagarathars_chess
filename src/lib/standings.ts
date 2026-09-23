export type PairingResult = "1-0" | "0-1" | "0.5-0.5" | "BYE";

export type StandingsPairing = {
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  result: string | null;
};

export type PlayerInfo = { id: string; fullName: string; ageCategory: string | null };

export type Standing = {
  player: PlayerInfo;
  played: number;
  score: number;
  buchholz: number;
  sonnebornBerger: number;
  rank: number;
};

/** Points a player earned from one pairing they were part of. 0 if they weren't in it. */
function pointsFor(playerId: string, p: StandingsPairing): number | null {
  if (p.whitePlayerId === playerId) {
    if (p.result === "1-0" || p.result === "BYE") return 1;
    if (p.result === "0.5-0.5") return 0.5;
    if (p.result === "0-1") return 0;
    return null; // not yet played
  }
  if (p.blackPlayerId === playerId) {
    if (p.result === "0-1") return 1;
    if (p.result === "0.5-0.5") return 0.5;
    if (p.result === "1-0") return 0;
    return null;
  }
  return null;
}

/** The opponent's player id for a given player in a pairing, or null for a bye/not-involved. */
function opponentOf(playerId: string, p: StandingsPairing): string | null {
  if (p.whitePlayerId === playerId) return p.blackPlayerId;
  if (p.blackPlayerId === playerId) return p.whitePlayerId;
  return null;
}

/**
 * Standard Swiss-tournament standings: match points, then Buchholz (sum of
 * opponents' scores) and Sonneborn-Berger (sum of opponent score × result
 * against them) as tiebreaks. Byes count as a full point and are excluded
 * from both tiebreak sums (no real opponent to attribute them to).
 */
export function computeStandings(players: PlayerInfo[], pairings: StandingsPairing[]): Standing[] {
  const scores = new Map<string, number>();
  const played = new Map<string, number>();

  for (const player of players) {
    let score = 0;
    let gamesPlayed = 0;
    for (const p of pairings) {
      const pts = pointsFor(player.id, p);
      if (pts !== null) {
        score += pts;
        if (p.result !== "BYE") gamesPlayed++;
      }
    }
    scores.set(player.id, score);
    played.set(player.id, gamesPlayed);
  }

  const standings: Standing[] = players.map((player) => {
    let buchholz = 0;
    let sonnebornBerger = 0;
    for (const p of pairings) {
      if (p.result === "BYE" || !p.result) continue;
      const opponentId = opponentOf(player.id, p);
      if (!opponentId) continue;
      const myPoints = pointsFor(player.id, p) ?? 0;
      const opponentScore = scores.get(opponentId) ?? 0;
      buchholz += opponentScore;
      sonnebornBerger += opponentScore * myPoints;
    }
    return {
      player,
      played: played.get(player.id) ?? 0,
      score: scores.get(player.id) ?? 0,
      buchholz,
      sonnebornBerger,
      rank: 0,
    };
  });

  standings.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz || b.sonnebornBerger - a.sonnebornBerger);

  let rank = 0;
  let prevKey = "";
  standings.forEach((s, i) => {
    const key = `${s.score}|${s.buchholz}|${s.sonnebornBerger}`;
    if (key !== prevKey) rank = i + 1;
    s.rank = rank;
    prevKey = key;
  });

  return standings;
}

/** Rank-1 finisher within each age category present in the standings. */
export function categoryWinners(standings: Standing[]): Record<string, Standing> {
  const winners: Record<string, Standing> = {};
  for (const s of standings) {
    const cat = s.player.ageCategory;
    if (!cat) continue;
    if (!winners[cat] || s.rank < winners[cat].rank) {
      winners[cat] = s;
    }
  }
  return winners;
}
