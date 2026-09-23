import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  const base =
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gold text-charcoal hover:bg-gold/90",
    outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-background",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  className = "",
  variant = "primary",
  children,
}: {
  href: string;
  className?: string;
  variant?: "primary" | "outline";
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors";
  const variants = {
    primary: "bg-gold text-charcoal hover:bg-gold/90",
    outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-background",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function Badge({
  children,
  tone = "charcoal",
}: {
  children: React.ReactNode;
  // "gold" reads fine on a dark surface (e.g. the tournament hero); on a
  // light surface use "gold-ink" instead — plain "gold" text fails contrast
  // there (see globals.css's --gold-ink token for why).
  tone?: "charcoal" | "gold" | "gold-ink" | "gray";
}) {
  const tones = {
    charcoal: "bg-charcoal/10 text-charcoal",
    gold: "bg-gold/10 text-gold",
    "gold-ink": "bg-gold/10 text-gold-ink",
    gray: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Page-width wrapper used to keep content aligned to the site's max content width. */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>;
}

/** Consistent section title block: optional gold eyebrow label, serif heading, optional description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const alignment = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`${alignment} ${className}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-ink">{eyebrow}</p>
      )}
      <h2 className={`font-bold text-charcoal ${eyebrow ? "mt-2" : ""} text-2xl`}>{title}</h2>
      {description && (
        <p
          className={`mt-2 text-foreground/60 ${align === "center" ? "mx-auto max-w-xl" : "max-w-xl"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Muted placeholder block for lists/sections with nothing to show yet. */
export function EmptyState({
  title = "Nothing here yet",
  message,
  icon,
  className = "",
}: {
  title?: string;
  message: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center ${className}`}
    >
      {icon && <span className="text-charcoal/30">{icon}</span>}
      <div>
        <p className="font-semibold text-charcoal">{title}</p>
        <p className="mt-1 text-sm text-foreground/60">{message}</p>
      </div>
    </div>
  );
}
