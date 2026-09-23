import { prisma } from "@/lib/prisma";

/**
 * Gets or creates the Player matching an email — the identity that ties a
 * person's registrations and results together across different tournaments.
 * Refreshes name/DOB on an existing record so it stays current.
 */
export async function getOrCreatePlayer(params: { email: string; fullName: string; dob?: Date | null }) {
  const email = params.email.trim().toLowerCase();
  return prisma.player.upsert({
    where: { email },
    update: { fullName: params.fullName, ...(params.dob ? { dob: params.dob } : {}) },
    create: { email, fullName: params.fullName, dob: params.dob ?? null },
  });
}
