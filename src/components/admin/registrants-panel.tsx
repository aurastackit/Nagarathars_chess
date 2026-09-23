"use client";

import { useMemo, useState } from "react";
import type { Registration } from "@prisma/client";
import { Badge, Card, EmptyState, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { AGE_CATEGORIES, ageCategoryLabel } from "@/lib/age-category";
import { KOVILS } from "@/lib/kovils";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
];

function statusTone(status: string): "gold" | "gray" | "charcoal" {
  if (status === "confirmed" || status === "registered") return "gold";
  if (status === "rejected") return "gray";
  return "charcoal";
}

export function RegistrantsPanel({
  registrations,
  setRegistrationStatus,
}: {
  registrations: Registration[];
  setRegistrationStatus: (formData: FormData) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [kovil, setKovil] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((r) => {
      if (q) {
        const haystack = `${r.fullName} ${r.email} ${r.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category !== "all" && r.ageCategory !== category) return false;
      const effectiveStatus = r.status === "registered" ? "confirmed" : r.status;
      if (status !== "all" && effectiveStatus !== status) return false;
      if (kovil !== "all" && r.kovil !== kovil) return false;
      return true;
    });
  }, [registrations, search, category, status, kovil]);

  const kovilsUsed = useMemo(
    () => [...new Set(registrations.map((r) => r.kovil).filter(Boolean))] as string[],
    [registrations]
  );

  return (
    <div className="mt-3">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
        <div>
          <label
            htmlFor="registrants-filter-search"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Search
          </label>
          <input
            id="registrants-filter-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or phone"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal"
          />
        </div>
        <div>
          <label
            htmlFor="registrants-filter-category"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Category
          </label>
          <Select
            id="registrants-filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {AGE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="registrants-filter-status"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Status
          </label>
          <Select
            id="registrants-filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="registrants-filter-kovil"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Kovil
          </label>
          <Select
            id="registrants-filter-kovil"
            value={kovil}
            onChange={(e) => setKovil(e.target.value)}
          >
            <option value="all">All kovils</option>
            {KOVILS.filter((k) => kovilsUsed.includes(k.label)).map((k) => (
              <option key={k.value} value={k.label}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-2 text-xs text-foreground/50">
        {filtered.length} of {registrations.length} shown
      </p>

      {filtered.length === 0 ? (
        <EmptyState className="mt-3" message="No registrants match these filters." />
      ) : (
        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal/5 text-foreground/60">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">DOB</th>
                  <th className="px-4 py-2 font-medium">Gender</th>
                  <th className="px-4 py-2 font-medium">City</th>
                  <th className="px-4 py-2 font-medium">Rating</th>
                  <th className="px-4 py-2 font-medium">FIDE ID</th>
                  <th className="px-4 py-2 font-medium">Kovil</th>
                  <th className="px-4 py-2 font-medium">Pirivu</th>
                  <th className="px-4 py-2 font-medium">Father</th>
                  <th className="px-4 py-2 font-medium">Mother</th>
                  <th className="px-4 py-2 font-medium">Sangam</th>
                  <th className="px-4 py-2 font-medium">Docs</th>
                  <th className="px-4 py-2 font-medium">Age category</th>
                  <th className="px-4 py-2 font-medium">Payment</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Registered</th>
                  <th className="px-4 py-2 font-medium">Review</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="px-4 py-2">{r.fullName}</td>
                    <td className="px-4 py-2">{r.email}</td>
                    <td className="px-4 py-2">{r.phone}</td>
                    <td className="px-4 py-2">{r.dob ? formatDate(r.dob) : "—"}</td>
                    <td className="px-4 py-2">{r.gender ?? "—"}</td>
                    <td className="px-4 py-2">{r.city ?? "—"}</td>
                    <td className="px-4 py-2">{r.rating ?? "—"}</td>
                    <td className="px-4 py-2">{r.fideId ?? "—"}</td>
                    <td className="px-4 py-2">{r.kovil ?? "—"}</td>
                    <td className="px-4 py-2">{r.pirivu ?? "—"}</td>
                    <td className="px-4 py-2">{r.fatherName ?? "—"}</td>
                    <td className="px-4 py-2">{r.motherName ?? "—"}</td>
                    <td className="px-4 py-2">{r.sangamMember ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        {r.ageProofKey && (
                          <a
                            href={`/api/admin/uploads?key=${encodeURIComponent(r.ageProofKey)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-charcoal hover:underline"
                          >
                            Age proof
                          </a>
                        )}
                        {r.passportPhotoKey && (
                          <a
                            href={`/api/admin/uploads?key=${encodeURIComponent(r.passportPhotoKey)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-charcoal hover:underline"
                          >
                            Photo
                          </a>
                        )}
                        {!r.ageProofKey &&
                          !r.passportPhotoKey &&
                          (r.aadhaarImageData || r.passportPhotoData
                            ? [
                                r.aadhaarImageData && "Aadhaar (legacy)",
                                r.passportPhotoData && "Photo (legacy)",
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : "—")}
                      </div>
                    </td>
                    <td className="px-4 py-2">{ageCategoryLabel(r.ageCategory)}</td>
                    <td className="px-4 py-2 capitalize">
                      {r.paymentStatus.replace(/_/g, " ")}
                      {r.amountPaid ? ` (₹${r.amountPaid})` : ""}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      {r.status === "rejected" && r.rejectionReason && (
                        <p className="mt-1 max-w-[160px] text-xs text-foreground/50">
                          {r.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">{formatDate(r.registeredAt)}</td>
                    <td className="px-4 py-2">
                      {r.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <form action={setRegistrationStatus}>
                              <input type="hidden" name="registrationId" value={r.id} />
                              <input type="hidden" name="next" value="confirmed" />
                              <button
                                type="submit"
                                className="text-xs font-semibold text-gold-ink hover:underline"
                              >
                                Confirm
                              </button>
                            </form>
                            <button
                              type="button"
                              onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Reject
                            </button>
                          </div>
                          {rejectingId === r.id && (
                            <form action={setRegistrationStatus} className="flex flex-col gap-1.5">
                              <input type="hidden" name="registrationId" value={r.id} />
                              <input type="hidden" name="next" value="rejected" />
                              <textarea
                                name="reason"
                                placeholder="Reason (included in the email)"
                                rows={2}
                                className="w-40 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal"
                              />
                              <button
                                type="submit"
                                className="self-start text-xs font-semibold text-red-600 hover:underline"
                              >
                                Confirm reject
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
