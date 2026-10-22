"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyActivity } from "@/lib/dashboard-metrics";

// Series colours are design tokens (--chart-1 logo navy, --chart-2 logo orange),
// validated together against the card surface. Fixed order: registrations, edits.
const SERIES = [
  { key: "registrations", label: "Registrations", color: "var(--chart-1)" },
  { key: "edits", label: "Edits", color: "var(--chart-2)" },
] as const;

// Recessive structure: hairline grid, quiet axis text.
const GRID = "var(--border)";
const AXIS_TEXT = "var(--muted)";

type TooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>;
};

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-charcoal">{label}</p>
      {SERIES.map((s) => {
        const value = Number(payload.find((p) => p.dataKey === s.key)?.value ?? 0);
        return (
          <p key={s.key} className="mt-1 flex items-center gap-2 text-foreground/80">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label}: <span className="font-semibold text-charcoal">{value}</span>
          </p>
        );
      })}
    </div>
  );
}

/** New applications vs player edits per day (IST), as grouped bars. */
export function RegistrationsVsEditsChart({ data }: { data: DailyActivity[] }) {
  const totals = {
    registrations: data.reduce((a, d) => a + d.registrations, 0),
    edits: data.reduce((a, d) => a + d.edits, 0),
  };
  const empty = totals.registrations === 0 && totals.edits === 0;

  return (
    <div>
      {/* Legend with totals: identity never relies on colour alone. */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground/70">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label} <span className="font-semibold text-charcoal">{totals[s.key]}</span>
          </li>
        ))}
      </ul>
      {empty ? (
        <p className="py-14 text-center text-sm text-foreground/50">
          No new applications or edits in the last {data.length} days.
        </p>
      ) : (
        <div
          className="mt-3 h-[200px]"
          role="img"
          aria-label="Registrations and edits per day; see the table view below"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
              barGap={2}
              barCategoryGap="25%"
            >
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: GRID }}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(23, 20, 15, 0.04)" }}
                content={(props) => <ChartTooltip {...(props as TooltipProps)} />}
              />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={12}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-medium text-foreground/60 hover:text-charcoal">
          View as table
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-foreground/50">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Registrations</th>
              <th className="py-1 text-right font-medium">Edits</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day} className="border-t border-border">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right tabular-nums">{d.registrations}</td>
                <td className="py-1 text-right tabular-nums">{d.edits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
