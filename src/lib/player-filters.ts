/**
 * The player list's filters, sorting and paging, read from / written to the URL
 * so a view can be shared, bookmarked and exported exactly as shown. Pure (no
 * DB): used by the page, the filter bar in the browser and the export routes.
 */

export const PLAYER_SORTS = [
  "registeredAt",
  "registrationNo",
  "fullName",
  "ageCategory",
  "gender",
  "kovil",
  "native",
  "status",
] as const;
export type PlayerSort = (typeof PLAYER_SORTS)[number];

export const PAGE_SIZES = [25, 50, 100] as const;

export const STATUS_FILTERS = [
  "pending",
  "confirmed",
  "changes_requested",
  "rejected",
  "withdrawn",
] as const;
export const DATE_CHANGE_FILTERS = ["pending", "accepted", "declined"] as const;

export type PlayerFilters = {
  /** Tournament id, or "all". */
  t: string;
  status: string;
  category: string;
  gender: string;
  kovil: string;
  /** Date-change response. */
  dc: string;
  q: string;
  /** Registered from / to, inclusive, as IST calendar dates (YYYY-MM-DD). */
  from: string;
  to: string;
  /** Only rows sharing a phone or email with another registration. */
  dup: boolean;
  sort: PlayerSort;
  dir: "asc" | "desc";
  page: number;
  per: (typeof PAGE_SIZES)[number];
};

export const DEFAULT_FILTERS: PlayerFilters = {
  t: "all",
  status: "",
  category: "",
  gender: "",
  kovil: "",
  dc: "",
  q: "",
  from: "",
  to: "",
  dup: false,
  sort: "registeredAt",
  dir: "desc",
  page: 1,
  per: 25,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[]) =>
  allowed.includes(value as T) ? (value as T) : undefined;

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string) {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Reads filters from a URL's search params; anything invalid falls back to the default. */
export function parsePlayerFilters(params: Params): PlayerFilters {
  const page = Number(get(params, "page"));
  const per = Number(get(params, "per"));
  return {
    t: get(params, "t")?.trim() || DEFAULT_FILTERS.t,
    status: oneOf(get(params, "status"), STATUS_FILTERS) ?? "",
    category: get(params, "category")?.trim() ?? "",
    gender: oneOf(get(params, "gender"), ["male", "female", "other"] as const) ?? "",
    kovil: get(params, "kovil")?.trim() ?? "",
    dc: oneOf(get(params, "dc"), DATE_CHANGE_FILTERS) ?? "",
    q: get(params, "q")?.trim().slice(0, 100) ?? "",
    from: DATE.test(get(params, "from") ?? "") ? get(params, "from")! : "",
    to: DATE.test(get(params, "to") ?? "") ? get(params, "to")! : "",
    dup: get(params, "dup") === "1",
    sort: oneOf(get(params, "sort"), PLAYER_SORTS) ?? DEFAULT_FILTERS.sort,
    dir:
      get(params, "dir") === "asc"
        ? "asc"
        : get(params, "dir") === "desc"
          ? "desc"
          : DEFAULT_FILTERS.dir,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    per: (PAGE_SIZES as readonly number[]).includes(per)
      ? (per as PlayerFilters["per"])
      : DEFAULT_FILTERS.per,
  };
}

/** The query string for a set of filters, leaving out defaults (so URLs stay short). */
export function playerFiltersQuery(filters: Partial<PlayerFilters>) {
  const merged = { ...DEFAULT_FILTERS, ...filters };
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_FILTERS) as (keyof PlayerFilters)[]) {
    const value = merged[key];
    if (value === DEFAULT_FILTERS[key]) continue;
    params.set(key, key === "dup" ? "1" : String(value));
  }
  return params.toString();
}

/** Sorting by a column: a new column starts with its natural direction; the same column flips. */
export function nextSort(current: PlayerFilters, column: PlayerSort) {
  if (current.sort === column)
    return { sort: column, dir: current.dir === "asc" ? "desc" : "asc" } as const;
  return { sort: column, dir: column === "registeredAt" ? "desc" : "asc" } as const;
}

/** Start and end instants of an inclusive IST date range ("" = open-ended). */
export function istDateRange(from: string, to: string) {
  const start = from ? new Date(`${from}T00:00:00+05:30`) : undefined;
  let end: Date | undefined;
  if (to) {
    end = new Date(`${to}T00:00:00+05:30`);
    end.setUTCDate(end.getUTCDate() + 1); // exclusive: up to the end of `to`
  }
  return { start, end };
}

/** Digits only, last 10 — so "+91 98765 43210" and "9876543210" count as the same phone. */
export function normalisePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

/**
 * Registrations in the same tournament that share a phone or an email, keyed
 * by registration id. Siblings often share a parent's phone — it's a flag for
 * a human to look at, never a block.
 */
export function findDuplicates(
  rows: {
    id: string;
    tournamentId: string;
    phone: string;
    email: string;
    registrationNo: string | null;
  }[]
) {
  const byKey = new Map<string, typeof rows>();
  const add = (key: string, row: (typeof rows)[number]) => {
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  };
  for (const r of rows) {
    const phone = normalisePhone(r.phone);
    if (phone) add(`${r.tournamentId}|phone|${phone}`, r);
    add(`${r.tournamentId}|email|${r.email.trim().toLowerCase()}`, r);
  }
  const result = new Map<string, { phone: string[]; email: string[] }>();
  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    const kind = key.split("|")[1] as "phone" | "email";
    for (const r of list) {
      const entry = result.get(r.id) ?? { phone: [], email: [] };
      entry[kind] = list.filter((o) => o.id !== r.id).map((o) => o.registrationNo ?? o.id);
      result.set(r.id, entry);
    }
  }
  return result;
}
