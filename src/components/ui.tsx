import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export type ButtonVariant = "primary" | "outline" | "dark";
export type ButtonSize = "md" | "sm";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gold text-charcoal hover:bg-gold/90",
  outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-background",
  dark: "bg-charcoal text-background hover:bg-charcoal/90",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-4 py-2 text-xs",
};

/**
 * Focus ring per surface: charcoal on light backgrounds, gold on charcoal ones
 * (a charcoal ring disappears on the dark hero; gold fails 3:1 on ivory).
 */
const FOCUS_RING = {
  light: "focus-visible:ring-charcoal focus-visible:ring-offset-background",
  dark: "focus-visible:ring-gold focus-visible:ring-offset-charcoal",
};

/** Single source of truth for button-styled visuals — shared by Button, LinkButton, and the rare plain `<a>` (e.g. file downloads) that can't go through next/link. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
  surface: "light" | "dark" = "light"
) {
  const base =
    "inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  return `${base} ${FOCUS_RING[surface]} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  className = "",
  variant = "primary",
  size = "md",
  surface = "light",
  children,
}: {
  href: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The background the button sits on — picks a focus ring that's visible there. */
  surface?: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className, surface)}>
      {children}
    </Link>
  );
}

export function Card({
  className = "",
  padding,
  children,
}: {
  className?: string;
  /** Inner padding — omit when the caller needs full control (e.g. an image bleeding to the edge). */
  padding?: "sm" | "md";
  children: React.ReactNode;
}) {
  const paddings = { sm: "p-4", md: "p-6" };
  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${padding ? paddings[padding] : ""} ${className}`}
    >
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
  size = "sm",
}: {
  children: React.ReactNode;
  // "gold" reads fine on a dark surface (e.g. the tournament hero); on a
  // light surface use "gold-ink" instead — plain "gold" text fails contrast
  // there (see globals.css's --gold-ink token for why). "white" is for a
  // neutral status pill on a dark/photo surface. "success"/"warning" are for
  // state (confirmed/pending), not brand accents — keep those to gold.
  tone?: "charcoal" | "gold" | "gold-ink" | "gray" | "white" | "success" | "warning" | "danger";
  /** "lg" is the bigger uppercase treatment used for standalone status pills. */
  size?: "sm" | "lg";
}) {
  const tones = {
    charcoal: "bg-charcoal/10 text-charcoal",
    gold: "bg-gold/10 text-gold",
    "gold-ink": "bg-gold/10 text-gold-ink",
    gray: "bg-gray-200 text-gray-700",
    white: "bg-white/10 text-white",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-red-100 text-red-700",
  };
  const sizes = {
    sm: "px-2.5 py-0.5 text-xs font-medium",
    lg: "px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  };
  return (
    <span className={`inline-block rounded-full ${sizes[size]} ${tones[tone]}`}>{children}</span>
  );
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
  title: ReactNode;
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
      <h2 className={`h2 text-charcoal ${eyebrow ? "mt-2" : ""}`}>{title}</h2>
      {description && (
        <p
          className={`text-body mt-2 text-muted ${align === "center" ? "mx-auto max-w-xl" : "max-w-xl"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Shared page-section wrapper: max-width 1200px, consistent vertical rhythm
 * (py-16 mobile / py-24 desktop = 64px/96px), and an optional heading block
 * (via SectionHeading) above the content. Use `tone="dark"` for a
 * charcoal/photo-background section (flips the heading to white); pass a
 * `background` node (e.g. an absolutely-positioned `<Image fill>` + overlay)
 * to layer imagery behind the content. `action` (e.g. a "View all" link)
 * sits to the right of a left-aligned heading.
 */
export function Section({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  background,
  action,
  className = "",
  headingClassName = "",
  children,
}: {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  background?: ReactNode;
  action?: ReactNode;
  className?: string;
  headingClassName?: string;
  children?: ReactNode;
}) {
  const heading = title && (
    <SectionHeading
      eyebrow={eyebrow}
      title={title}
      description={subtitle}
      align={align}
      className={`${tone === "dark" ? "[&_h2]:text-white [&_p]:text-white/70" : ""} ${headingClassName}`}
    />
  );
  return (
    <section
      className={`relative overflow-hidden py-16 sm:py-24 ${tone === "dark" ? "bg-charcoal text-white" : ""} ${className}`}
    >
      {background}
      <div className="relative mx-auto max-w-6xl px-4">
        {action ? (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            {heading}
            <div className="flex-none">{action}</div>
          </div>
        ) : (
          heading
        )}
        {children && <div className={title ? "mt-10" : ""}>{children}</div>}
      </div>
    </section>
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
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
