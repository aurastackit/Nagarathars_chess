import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AGE_CATEGORIES, ageCategoryLabel } from "@/lib/age-category";
import { formatDateTimeIST } from "@/lib/format";
import { registrationAdminHref } from "@/lib/admin-links";
import { SEAT_HOLDING_STATUSES, fixByDate } from "@/lib/registration-status";
import {
  approvalRate,
  dailyRegistrationsAndEdits,
  lastDaysIST,
  relativeTime,
  seatsLeft,
} from "@/lib/dashboard-metrics";

export const CHART_DAYS = 14;
const EMAIL_WINDOW_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export type AttentionItem = {
  id: string;
  kind: "pending" | "changes" | "date" | "email";
  urgent: boolean;
  title: string;
  who: string;
  detail: string;
  href: string;
  at: Date;
};

const EVENT_LABEL: Record<string, string> = {
  submitted: "Submitted an application",
  edited: "Edited and resubmitted",
  confirmed: "Confirmed",
  rejected: "Rejected",
  changes_requested: "Asked for changes",
  reopened: "Re-opened for review",
  withdrawn: "Withdrawn",
  email_failed: "Email failed",
  document_viewed: "Viewed a document",
  document_deleted: "Document deleted",
  date_change_confirmed: "Confirmed the new date",
};

/**
 * Everything the dashboard shows, for one tournament or all of them
 * (`tournamentId` null). All queries run in parallel — one database round trip.
 */
export async function getDashboard(tournamentId: string | null) {
  const now = new Date();
  const scope: Prisma.RegistrationWhereInput = tournamentId ? { tournamentId } : {};
  const eventScope: Prisma.RegistrationEventWhereInput = tournamentId
    ? { registration: { tournamentId } }
    : {};
  const days = lastDaysIST(CHART_DAYS, now);
  const chartStart = new Date(`${days[0].key}T00:00:00+05:30`);
  const emailSince = new Date(now.getTime() - EMAIL_WINDOW_DAYS * DAY);

  const [
    tournament,
    statusGroups,
    dateChangeGroups,
    categoryGender,
    chartEvents,
    attentionRegs,
    failedEmails,
    emailGroups,
    recent,
  ] = await Promise.all([
    tournamentId
      ? prisma.tournament.findUnique({
          where: { id: tournamentId },
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            registrationDeadline: true,
            maxParticipants: true,
            dateChangedAt: true,
            previousStartDate: true,
          },
        })
      : null,
    prisma.registration.groupBy({ by: ["status"], where: scope, _count: true }),
    prisma.registration.groupBy({
      by: ["dateChangeResponse"],
      where: { ...scope, dateChangeResponse: { not: null } },
      _count: true,
    }),
    prisma.registration.groupBy({
      by: ["ageCategory", "gender"],
      where: { ...scope, status: { in: SEAT_HOLDING_STATUSES } },
      _count: true,
    }),
    prisma.registrationEvent.findMany({
      where: {
        ...eventScope,
        type: { in: ["submitted", "edited"] },
        createdAt: { gte: chartStart },
      },
      select: { type: true, createdAt: true },
    }),
    prisma.registration.findMany({
      where: {
        ...scope,
        OR: [
          { status: { in: ["pending", "changes_requested"] } },
          { dateChangeResponse: "pending" },
        ],
      },
      select: {
        id: true,
        tournamentId: true,
        fullName: true,
        registrationNo: true,
        ageCategory: true,
        status: true,
        registeredAt: true,
        updatedAt: true,
        reviewedAt: true,
        dateChangeResponse: true,
      },
      orderBy: { registeredAt: "asc" },
      take: 200,
    }),
    prisma.registrationEvent.findMany({
      where: { ...eventScope, type: "email_failed", createdAt: { gte: emailSince } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        registration: {
          select: { id: true, tournamentId: true, fullName: true, registrationNo: true },
        },
      },
    }),
    prisma.registrationEvent.groupBy({
      by: ["type"],
      where: {
        ...eventScope,
        type: { in: ["email_sent", "email_failed"] },
        createdAt: { gte: emailSince },
      },
      _count: true,
    }),
    prisma.registrationEvent.findMany({
      where: { ...eventScope, type: { not: "email_sent" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        registration: {
          select: {
            id: true,
            tournamentId: true,
            fullName: true,
            registrationNo: true,
            tournament: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  // Status counts ("registered" is the legacy name for confirmed).
  const count = (status: string) =>
    statusGroups
      .filter((g) => (g.status === "registered" ? "confirmed" : g.status) === status)
      .reduce((a, g) => a + g._count, 0);
  const statuses = {
    total: statusGroups.reduce((a, g) => a + g._count, 0),
    pending: count("pending"),
    confirmed: count("confirmed"),
    rejected: count("rejected"),
    changesRequested: count("changes_requested"),
    withdrawn: count("withdrawn"),
  };
  const seatsTaken = statuses.pending + statuses.confirmed + statuses.changesRequested;
  const dateChange = {
    accepted: dateChangeGroups.find((g) => g.dateChangeResponse === "accepted")?._count ?? 0,
    pending: dateChangeGroups.find((g) => g.dateChangeResponse === "pending")?._count ?? 0,
    declined: dateChangeGroups.find((g) => g.dateChangeResponse === "declined")?._count ?? 0,
  };

  // Category × gender (seat-holding registrations only).
  const genders = ["male", "female", "other"] as const;
  const hasUnknownGender = categoryGender.some(
    (g) => !g.gender || !(genders as readonly string[]).includes(g.gender)
  );
  const cell = (category: string | null, gender: string | null) =>
    categoryGender
      .filter(
        (g) =>
          g.ageCategory === category &&
          (gender === null
            ? !g.gender || !(genders as readonly string[]).includes(g.gender)
            : g.gender === gender)
      )
      .reduce((a, g) => a + g._count, 0);
  const categoryRows = AGE_CATEGORIES.map((c) => ({
    label: c.label,
    male: cell(c.value, "male"),
    female: cell(c.value, "female"),
    other: cell(c.value, "other"),
    unknown: cell(c.value, null),
  })).map((r) => ({ ...r, total: r.male + r.female + r.other + r.unknown }));

  // Needs attention: oldest/most urgent first.
  const attention: AttentionItem[] = [];
  for (const r of attentionRegs) {
    const who = `${r.fullName}${r.registrationNo ? ` · ${r.registrationNo}` : ""}`;
    const href = registrationAdminHref(r.id);
    if (r.status === "pending") {
      const waiting = now.getTime() - r.updatedAt.getTime();
      attention.push({
        id: `p-${r.id}`,
        kind: "pending",
        urgent: waiting > 2 * DAY,
        title: "Waiting for review",
        who,
        detail: `${ageCategoryLabel(r.ageCategory)} · submitted ${relativeTime(r.registeredAt, now)}`,
        href,
        at: r.updatedAt,
      });
    }
    if (r.status === "changes_requested" && r.reviewedAt) {
      const fixBy = fixByDate(r.reviewedAt);
      attention.push({
        id: `c-${r.id}`,
        kind: "changes",
        urgent: fixBy.getTime() - now.getTime() < 2 * DAY,
        title: "Waiting for the player's changes",
        who,
        detail: `Fix by ${formatDateTimeIST(fixBy)} IST (${relativeTime(fixBy, now)})`,
        href,
        at: r.reviewedAt,
      });
    }
    if (r.dateChangeResponse === "pending") {
      attention.push({
        id: `d-${r.id}`,
        kind: "date",
        urgent: false,
        title: "Hasn't confirmed the new date",
        who,
        detail: "No reply to the date change yet",
        href,
        at: r.updatedAt,
      });
    }
  }
  for (const e of failedEmails) {
    attention.push({
      id: `e-${e.id}`,
      kind: "email",
      urgent: true,
      title: "Email didn't go out",
      who: `${e.registration.fullName}${e.registration.registrationNo ? ` · ${e.registration.registrationNo}` : ""}`,
      detail: `${e.note ?? "Email"} · ${relativeTime(e.createdAt, now)}`,
      href: registrationAdminHref(e.registration.id),
      at: e.createdAt,
    });
  }
  attention.sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.at.getTime() - b.at.getTime());

  const sent = emailGroups.find((g) => g.type === "email_sent")?._count ?? 0;
  const failed = emailGroups.find((g) => g.type === "email_failed")?._count ?? 0;

  return {
    tournament,
    statuses,
    seats: {
      taken: seatsTaken,
      max: tournament?.maxParticipants ?? null,
      left: tournament ? seatsLeft(tournament.maxParticipants, seatsTaken) : null,
    },
    approvalRate: approvalRate(statuses.confirmed, statuses.rejected),
    dateChange,
    categoryRows,
    showUnknownGender: hasUnknownGender,
    chart: dailyRegistrationsAndEdits(chartEvents, days),
    attention,
    email: {
      windowDays: EMAIL_WINDOW_DAYS,
      sent,
      failed,
      lastFailure: failedEmails[0]
        ? {
            note: failedEmails[0].note,
            when: relativeTime(failedEmails[0].createdAt, now),
            who: failedEmails[0].registration.fullName,
          }
        : null,
    },
    recent: recent.map((e) => ({
      id: e.id,
      what: EVENT_LABEL[e.type] ?? e.type,
      type: e.type,
      who: e.registration.fullName,
      registrationNo: e.registration.registrationNo,
      tournament: e.registration.tournament.title,
      actor:
        e.actorType === "admin"
          ? (e.actor ?? "admin")
          : e.actorType === "system"
            ? "System"
            : "Player",
      when: relativeTime(e.createdAt, now),
      at: e.createdAt,
      href: registrationAdminHref(e.registration.id),
    })),
  };
}

/** Tournaments for the switcher, and the one shown by default: the next upcoming, else the latest. */
export async function getDashboardTournaments() {
  const list = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, title: true, startDate: true, status: true },
  });
  const today = new Date(new Date().toISOString().slice(0, 10));
  const upcoming = list.filter((t) => t.startDate >= today && t.status !== "draft").at(-1);
  return { list, defaultId: upcoming?.id ?? list[0]?.id ?? null };
}
