"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ScoreHistoryChart({ data }: { data: { label: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#c3c2b7" }} tick={{ fill: "#898781", fontSize: 11 }} />
        <YAxis hide />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e1e0d9" }} />
        <Bar dataKey="score" fill="#c8922f" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
