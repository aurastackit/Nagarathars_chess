import { Badge } from "@/components/ui";

const STATUS: Record<
  string,
  { label: string; tone: "warning" | "success" | "danger" | "gray" | "gold-ink" }
> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  registered: { label: "Confirmed", tone: "success" },
  changes_requested: { label: "Changes requested", tone: "gold-ink" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "gray" },
};

const DATE_CHANGE: Record<string, string> = {
  pending: "New date: no reply",
  accepted: "New date accepted",
  declined: "New date declined",
};

export const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
);

/** A registration's status (with its text label, never colour alone), plus the date-change reply when there is one. */
export function StatusBadges({
  status,
  dateChange,
}: {
  status: string;
  dateChange?: string | null;
}) {
  const s = STATUS[status] ?? { label: status, tone: "gray" as const };
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={s.tone}>{s.label}</Badge>
      {dateChange && (
        <Badge tone={dateChange === "pending" ? "warning" : "gray"}>
          {DATE_CHANGE[dateChange] ?? dateChange}
        </Badge>
      )}
    </span>
  );
}
