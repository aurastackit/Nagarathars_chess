import { NextResponse } from "next/server";
import { clearPlayerSession } from "@/lib/player-session";

/** Ends the player's self-service session on this browser. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearPlayerSession(res);
  return res;
}
