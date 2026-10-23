import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PLAYER_SESSION_COOKIE,
  PLAYER_SESSION_HOURS,
  signPlayerToken,
  verifyPlayerToken,
} from "@/lib/player-token";

const secret = () => process.env.AUTH_SECRET ?? "";

/** The email this browser proved it owns (via the emailed code), or null. */
export async function getPlayerEmail() {
  const jar = await cookies();
  return verifyPlayerToken(jar.get(PLAYER_SESSION_COOKIE)?.value, secret());
}

/** Starts a self-service session on a route response (after a correct code). */
export function setPlayerSession(res: NextResponse, email: string) {
  res.cookies.set(PLAYER_SESSION_COOKIE, signPlayerToken(email, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLAYER_SESSION_HOURS * 60 * 60,
  });
}

export function clearPlayerSession(res: NextResponse) {
  res.cookies.set(PLAYER_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** A registration the signed-in player may manage: same email (any case). */
export async function getOwnedRegistration(id: string, email: string) {
  const r = await prisma.registration.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!r || r.email.trim().toLowerCase() !== email) return null;
  return r;
}

/** Every registration under the signed-in email — a parent may have several children. */
export function listOwnedRegistrations(email: string) {
  return prisma.registration.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { tournament: true },
    orderBy: [{ tournament: { startDate: "desc" } }, { registeredAt: "asc" }],
  });
}
