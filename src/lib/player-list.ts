import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ageCategoryLabel } from "@/lib/age-category";
import { formatDateTimeIST } from "@/lib/format";
import { AGE_PROOF_TYPES } from "@/lib/registration-schema";
import { findDuplicates, istDateRange, type PlayerFilters } from "@/lib/player-filters";

/** Prisma filter for everything except the duplicates-only flag (which needs a second pass). */
function baseWhere(f: PlayerFilters): Prisma.RegistrationWhereInput {
  const { start, end } = istDateRange(f.from, f.to);
  const q = f.q;
  const digits = q.replace(/\D/g, "");
  return {
    ...(f.t !== "all" && { tournamentId: f.t }),
    ...(f.status && { status: f.status }),
    ...(f.category && { ageCategory: f.category }),
    ...(f.gender && { gender: f.gender }),
    ...(f.kovil && { kovil: f.kovil }),
    ...(f.dc && { dateChangeResponse: f.dc }),
    ...((start || end) && {
      registeredAt: { ...(start && { gte: start }), ...(end && { lt: end }) },
    }),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { registrationNo: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      ],
    }),
  };
}

// Optional columns: blanks go last whichever way you sort (Prisma only allows `nulls` on these).
const NULLABLE_SORTS = new Set(["registrationNo", "ageCategory", "gender", "kovil", "native"]);

function orderBy(f: PlayerFilters): Prisma.RegistrationOrderByWithRelationInput[] {
  const first = NULLABLE_SORTS.has(f.sort)
    ? { [f.sort]: { sort: f.dir, nulls: "last" } }
    : { [f.sort]: f.dir };
  // Ties broken by submission time (then id) so paging is stable.
  return [first, { registeredAt: "desc" }, { id: "asc" }] as Prisma.RegistrationOrderByWithRelationInput[];
}

/**
 * Duplicate flags for the filter's tournament scope (or every tournament).
 * Withdrawn registrations don't count. Returns the flags and the ids involved.
 */
async function duplicatesFor(f: PlayerFilters) {
  const scope = await prisma.registration.findMany({
    where: { ...(f.t !== "all" && { tournamentId: f.t }), status: { not: "withdrawn" } },
    select: { id: true, tournamentId: true, phone: true, email: true, registrationNo: true },
  });
  return findDuplicates(scope);
}

const LIST_SELECT = {
  id: true,
  tournamentId: true,
  registrationNo: true,
  fullName: true,
  email: true,
  phone: true,
  gender: true,
  ageCategory: true,
  kovil: true,
  native: true,
  status: true,
  dateChangeResponse: true,
  registeredAt: true,
  tournament: { select: { title: true } },
} satisfies Prisma.RegistrationSelect;

/** One page of the player list plus everything the filter bar needs. */
export async function getPlayerList(f: PlayerFilters) {
  const [duplicates, tournaments, kovils] = await Promise.all([
    duplicatesFor(f),
    prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, startDate: true },
    }),
    prisma.registration.findMany({
      where: f.t !== "all" ? { tournamentId: f.t } : {},
      distinct: ["kovil"],
      select: { kovil: true },
      orderBy: { kovil: "asc" },
    }),
  ]);
  const where: Prisma.RegistrationWhereInput = {
    ...baseWhere(f),
    ...(f.dup && { id: { in: [...duplicates.keys()] } }),
  };
  const [total, rows] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      orderBy: orderBy(f),
      skip: (f.page - 1) * f.per,
      take: f.per,
      select: LIST_SELECT,
    }),
  ]);
  return {
    total,
    rows: rows.map((r) => ({
      ...r,
      registeredAt: r.registeredAt.toISOString(),
      registeredLabel: formatDateTimeIST(r.registeredAt),
      categoryLabel: ageCategoryLabel(r.ageCategory),
      tournamentTitle: r.tournament.title,
      duplicate: duplicates.get(r.id) ?? null,
    })),
    tournaments: tournaments.map((t) => ({
      id: t.id,
      title: t.title,
      year: t.startDate.getUTCFullYear(),
    })),
    kovils: kovils.map((k) => k.kovil).filter((k): k is string => Boolean(k)),
  };
}

export type PlayerRow = Awaited<ReturnType<typeof getPlayerList>>["rows"][number];

const AGE_PROOF_LABEL = Object.fromEntries(AGE_PROOF_TYPES.map((t) => [t.value, t.label]));

/**
 * Every column for export: the rows matching the filters (all pages), or just
 * `ids` when given (bulk "Export selected"). Times are IST.
 */
export async function registrationsExportTable(f: PlayerFilters, ids?: string[]) {
  const duplicates = await duplicatesFor(f);
  const where: Prisma.RegistrationWhereInput = ids?.length
    ? { id: { in: ids } }
    : { ...baseWhere(f), ...(f.dup && { id: { in: [...duplicates.keys()] } }) };
  const rows = await prisma.registration.findMany({
    where,
    orderBy: orderBy(f),
    include: { tournament: { select: { title: true } } },
  });
  const headers = [
    "Registration no.",
    "Tournament",
    "Status",
    "Full name",
    "Email",
    "Phone",
    "Possible duplicate",
    "Birth year",
    "Gender",
    "Age category",
    "City",
    "Address",
    "Rating",
    "FIDE ID",
    "Native",
    "Kovil",
    "Pirivu",
    "Father name",
    "Mother name",
    "Father side grandparents",
    "Mother side grandparents",
    "Mother native",
    "Mother Kovil",
    "Mother Pirivu",
    "Sangam member",
    "Sangam relative",
    "Age proof type",
    "Age proof uploaded",
    "Passport photo uploaded",
    "Payment status",
    "Amount paid",
    "Reason shown to player",
    "New date response",
    "Registered at (IST)",
    "Last updated (IST)",
    "Reviewed at (IST)",
    "Reviewed by",
  ];
  const table = rows.map((r) => {
    const dup = duplicates.get(r.id);
    return [
      r.registrationNo ?? "",
      r.tournament.title,
      r.status,
      r.fullName,
      r.email,
      r.phone,
      dup
        ? [
            dup.phone.length && `same phone as ${dup.phone.join(", ")}`,
            dup.email.length && `same email as ${dup.email.join(", ")}`,
          ]
            .filter(Boolean)
            .join("; ")
        : "",
      r.dob ? r.dob.getUTCFullYear() : "",
      r.gender ?? "",
      ageCategoryLabel(r.ageCategory),
      r.city ?? "",
      r.address ?? "",
      r.rating ?? "",
      r.fideId ?? "",
      r.native ?? "",
      r.kovil ?? "",
      r.pirivu ?? "",
      r.fatherName ?? "",
      r.motherName ?? "",
      r.fatherGrandparents ?? "",
      r.motherGrandparents ?? "",
      r.motherNative ?? "",
      r.motherKovil ?? "",
      r.motherPirivu ?? "",
      r.sangamMember ? "Yes" : "No",
      r.sangamRelativeName ?? "",
      r.ageProofType ? (AGE_PROOF_LABEL[r.ageProofType] ?? r.ageProofType) : "",
      r.ageProofKey || r.aadhaarImageData ? "Yes" : "No",
      r.passportPhotoKey || r.passportPhotoData ? "Yes" : "No",
      r.paymentStatus,
      r.amountPaid ?? "",
      r.rejectionReason ?? "",
      r.dateChangeResponse ?? "",
      formatDateTimeIST(r.registeredAt),
      formatDateTimeIST(r.updatedAt),
      r.reviewedAt ? formatDateTimeIST(r.reviewedAt) : "",
      r.reviewedBy ?? "",
    ];
  });
  return { headers, rows: table, count: rows.length };
}
