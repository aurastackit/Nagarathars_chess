import type { Player, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { playerKey, tidyName } from "@/lib/player-key";

export { normalizeEmail, playerKey } from "@/lib/player-key";

type Db = Prisma.TransactionClient | PrismaClient;

/**
 * Gets or creates this person's Player — the identity that ties their
 * registrations and results together across tournaments (see playerKey) —
 * keeping the name's latest spelling. Pass the transaction client to run inside
 * one. Safe when two submissions race: the insert skips a row someone else just
 * created.
 */
export async function getOrCreatePlayer(
  params: { email: string; fullName: string; dob?: Date | null },
  db: Db = prisma
): Promise<Player> {
  const key = playerKey(params);
  const fullName = tidyName(params.fullName);
  const dob = params.dob ?? null;
  const found = await db.player.findFirst({ where: key });
  if (found) {
    if (found.fullName === fullName && (found.dob || !dob)) return found;
    // A date of birth already on record (the old form took the full date) is kept.
    return db.player.update({
      where: { id: found.id },
      data: { fullName, ...(!found.dob && dob && { dob }) },
    });
  }
  await db.player.createMany({ data: [{ ...key, fullName, dob }], skipDuplicates: true });
  const created = await db.player.findFirst({ where: key });
  if (!created) throw new Error("Could not create the player profile");
  return created;
}
