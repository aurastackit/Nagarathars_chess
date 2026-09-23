"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Validated (see dataviz skill's validate_palette.js) against this site's
// card surface — fixed order, one hue per age category, never cycled.
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

const GRID_COLOR = "#e1e0d9";
const AXIS_COLOR = "#c3c2b7";
const MUTED_TEXT = "#898781";

export function CategoryBreakdownChart({ data }: { data: { label: string; count: number }[] }) {
  if (data.every((d) => d.count === 0)) {
    return <p className="py-8 text-center text-sm text-foreground/50">No registrations yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tickLine={false}
          axisLine={{ stroke: AXIS_COLOR }}
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_COLOR }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "#0b0b0b", fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RegistrationsOverTimeChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <p className="py-8 text-center text-sm text-foreground/50">
        No registrations in this window.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={{ stroke: AXIS_COLOR }}
          tick={{ fill: MUTED_TEXT, fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_COLOR }}
        />
        <Bar dataKey="count" fill="#c8922f" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TournamentsBarList({ data }: { data: { title: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.title} className="flex items-center gap-3 text-sm">
          <span className="w-32 flex-none truncate text-foreground/70">{d.title}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal/10">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 flex-none text-right font-semibold text-charcoal">{d.count}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-foreground/50">No registrations yet.</p>}
    </div>
  );
}
