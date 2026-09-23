"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { QueenIcon } from "@/components/icons/chess-pieces";

export type Profile = {
  id: string;
  name: string;
  role: string;
  initials: string;
  bio: string;
  facts: { label: string; value: string }[];
  highlights?: string[];
};

const NODE_COLORS = [
  "var(--charcoal)",
  "var(--gold)",
  "color-mix(in srgb, var(--charcoal), var(--gold) 55%)",
  "color-mix(in srgb, var(--charcoal), transparent 35%)",
  "color-mix(in srgb, var(--gold), var(--charcoal) 40%)",
  "color-mix(in srgb, var(--charcoal), transparent 55%)",
  "color-mix(in srgb, var(--gold), transparent 20%)",
];

export function ProfileGrid({
  profiles,
  gridClassName,
  layout = "grid",
}: {
  profiles: Profile[];
  gridClassName?: string;
  layout?: "grid" | "circle" | "list" | "circle-side";
}) {
  const [modalProfile, setModalProfile] = useState<Profile | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = profiles[activeIndex] ?? profiles[0];

  useEffect(() => {
    if (!modalProfile) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalProfile(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalProfile]);

  if (layout === "circle") {
    return (
      <div className="relative mx-auto mt-8 aspect-square w-full max-w-sm sm:max-w-md">
        <div
          className="absolute inset-[10%] rounded-full border-2 border-dashed border-charcoal/15"
          aria-hidden="true"
        />

        <div className="absolute inset-[19%] flex items-center justify-center rounded-full bg-card p-4 text-center shadow-md">
          {active && (
            <div>
              <span
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: NODE_COLORS[activeIndex % NODE_COLORS.length] }}
              >
                {active.initials}
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-foreground">{active.name}</h3>
              <p className="text-xs font-medium text-gold-ink">{active.role}</p>
              {active.facts.length > 0 && (
                <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                  {active.facts.map((f) => (
                    <span
                      key={f.label}
                      className="rounded-full bg-charcoal/5 px-2 py-0.5 text-[10px] font-semibold text-charcoal"
                    >
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setModalProfile(active)}
                className="mt-1.5 text-[11px] font-semibold text-charcoal hover:underline"
              >
                Know more &rarr;
              </button>
            </div>
          )}
        </div>

        {profiles.map((p, i) => {
          const angle = (i / profiles.length) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + 46 * Math.cos(angle);
          const y = 50 + 46 * Math.sin(angle);
          const isActive = i === activeIndex;
          return (
            <Reveal
              key={p.id}
              delay={i * 90}
              className="absolute w-16 sm:w-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className="flex w-full flex-col items-center gap-1"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-4 transition-transform hover:scale-105 sm:h-12 sm:w-12 ${
                    isActive ? "ring-gold scale-110" : "ring-card"
                  }`}
                  style={{ backgroundColor: NODE_COLORS[i % NODE_COLORS.length] }}
                >
                  {p.initials}
                </span>
                <span className="text-center text-[10px] font-semibold leading-tight text-foreground">
                  {p.name}
                </span>
              </button>
            </Reveal>
          );
        })}

        {modalProfile && (
          <ProfileModalOverlay profile={modalProfile} onClose={() => setModalProfile(null)} />
        )}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="mt-10 flex flex-col gap-6 md:flex-row">
        <div className="flex gap-3 overflow-x-auto pb-2 md:w-64 md:flex-none md:flex-col md:overflow-visible md:pb-0">
          {profiles.map((p, i) => {
            const isActive = i === activeIndex;
            return (
              <Reveal key={p.id} delay={i * 80} className="flex-none md:flex-auto">
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 rounded-full border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? "border-charcoal bg-charcoal/5"
                      : "border-border bg-card hover:bg-background"
                  }`}
                >
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: NODE_COLORS[i % NODE_COLORS.length] }}
                  >
                    {p.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-foreground/50">{p.role}</span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        {active && <DetailPanel profile={active} colorIndex={activeIndex} className="flex-1" />}
      </div>
    );
  }

  if (layout === "circle-side") {
    return (
      <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[18rem] flex-none sm:max-w-xs">
          <div
            className="absolute inset-[10%] rounded-full border-2 border-dashed border-charcoal/15"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <QueenIcon className="h-16 w-16 text-charcoal/10" strokeWidth={0.7} />
          </div>
          {profiles.map((p, i) => {
            const angle = (i / profiles.length) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + 46 * Math.cos(angle);
            const y = 50 + 46 * Math.sin(angle);
            const isActive = i === activeIndex;
            return (
              <Reveal
                key={p.id}
                delay={i * 90}
                className="absolute w-16 sm:w-20"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className="flex w-full flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-4 transition-transform hover:scale-105 sm:h-12 sm:w-12 ${
                      isActive ? "ring-gold scale-110" : "ring-card"
                    }`}
                    style={{ backgroundColor: NODE_COLORS[i % NODE_COLORS.length] }}
                  >
                    {p.initials}
                  </span>
                  <span className="text-center text-[10px] font-semibold leading-tight text-foreground">
                    {p.name}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        {active && <DetailPanel profile={active} colorIndex={activeIndex} className="flex-1" />}
      </div>
    );
  }

  return (
    <>
      <div className={gridClassName ?? "mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-4"}>
        {profiles.map((p, i) => (
          <Reveal key={p.id} delay={i * 90}>
            <button
              type="button"
              onClick={() => setModalProfile(p)}
              className="w-full rounded-lg border border-border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-lg font-bold text-white">
                {p.initials}
              </span>
              <p className="mt-3 font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-foreground/50">{p.role}</p>
            </button>
          </Reveal>
        ))}
      </div>
      {modalProfile && (
        <ProfileModalOverlay profile={modalProfile} onClose={() => setModalProfile(null)} />
      )}
    </>
  );
}

function DetailPanel({
  profile,
  colorIndex,
  className = "",
}: {
  profile: Profile;
  colorIndex: number;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 flex-none items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: NODE_COLORS[colorIndex % NODE_COLORS.length] }}
        >
          {profile.initials}
        </span>
        <div>
          <h3 className="text-lg font-bold text-foreground">{profile.name}</h3>
          <p className="text-sm font-medium text-gold-ink">{profile.role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-foreground/70">{profile.bio}</p>
      {profile.facts.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
          {profile.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-foreground/50">{f.label}</dt>
              <dd className="text-sm font-semibold text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {profile.highlights && profile.highlights.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Highlights
          </p>
          <ul className="mt-3 space-y-2">
            {profile.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-foreground/70">
                <span className="mt-0.5 text-gold-ink">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 border-t border-border pt-4">
        <Link href="/classes" className="text-sm font-semibold text-charcoal hover:underline">
          Explore classes with {profile.name} &rarr;
        </Link>
      </div>
    </div>
  );
}

function ProfileModalOverlay({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-lg font-bold text-white">
            {profile.initials}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-foreground/40 transition-colors hover:bg-background hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{profile.name}</h3>
        <p className="text-sm font-medium text-gold-ink">{profile.role}</p>
        <p className="mt-3 text-sm text-foreground/70">{profile.bio}</p>
        {profile.facts.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            {profile.facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-foreground/50">{f.label}</dt>
                <dd className="text-sm font-semibold text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
