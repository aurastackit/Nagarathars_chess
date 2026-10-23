"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import {
  ATTENTION_RING,
  AttentionNote,
  useNeedsAttention,
} from "@/components/registration-wizard/attention";

const inputClasses =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal disabled:cursor-not-allowed disabled:bg-background disabled:text-foreground/40";

function FieldShell({
  label,
  htmlFor,
  helper,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const attention = useNeedsAttention(htmlFor);
  return (
    <div className={`${className} ${attention ? ATTENTION_RING : ""}`} data-field={htmlFor}>
      {attention && <AttentionNote />}
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-red-600">
          {error.message}
        </p>
      ) : (
        helper && <p className="mt-1 text-xs text-foreground/50">{helper}</p>
      )}
    </div>
  );
}

/** Marks an input invalid and points it at its error message for screen readers. */
function errorAttrs(id: string, error?: FieldError) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

export function TextField({
  label,
  helper,
  error,
  className,
  registration,
  suffix,
  sanitize,
  ...props
}: {
  label: string;
  helper?: string;
  error?: FieldError;
  className?: string;
  registration: UseFormRegisterReturn;
  /** Rendered inline next to the input, e.g. an email-verify button. */
  suffix?: ReactNode;
  /** Cleans what's typed or pasted before the form reads it, e.g. digits only. */
  sanitize?: (value: string) => string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const field = sanitize
    ? {
        ...registration,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          e.target.value = sanitize(e.target.value);
          return registration.onChange(e);
        },
      }
    : registration;
  const input = (
    <input
      id={registration.name}
      className={inputClasses}
      {...errorAttrs(registration.name, error)}
      {...field}
      {...props}
    />
  );

  return (
    <FieldShell
      label={label}
      htmlFor={registration.name}
      helper={helper}
      error={error}
      required={props.required}
      className={className}
    >
      {suffix ? (
        <div className="flex items-center gap-2">
          {input}
          {suffix}
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

/** A box showing a value the player can read but not change. */
export function ReadOnlyField({
  id,
  label,
  value,
  helper,
  className,
}: {
  id: string;
  label: string;
  value: string;
  helper?: string;
  className?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} helper={helper} className={className}>
      <input
        id={id}
        readOnly
        value={value}
        className={`${inputClasses} cursor-not-allowed bg-background font-medium`}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  helper,
  error,
  className,
  registration,
  ...props
}: {
  label: string;
  helper?: string;
  error?: FieldError;
  className?: string;
  registration: UseFormRegisterReturn;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell
      label={label}
      htmlFor={registration.name}
      helper={helper}
      error={error}
      required={props.required}
      className={className}
    >
      <textarea
        id={registration.name}
        rows={2}
        className={inputClasses}
        {...errorAttrs(registration.name, error)}
        {...registration}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  helper,
  error,
  className,
  registration,
  children,
  ...props
}: {
  label: string;
  helper?: string;
  error?: FieldError;
  className?: string;
  registration: UseFormRegisterReturn;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell
      label={label}
      htmlFor={registration.name}
      helper={helper}
      error={error}
      required={props.required}
      className={className}
    >
      <select
        id={registration.name}
        className={inputClasses}
        {...errorAttrs(registration.name, error)}
        {...registration}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  error,
  className = "",
  registration,
}: {
  label: ReactNode;
  error?: FieldError;
  className?: string;
  registration: UseFormRegisterReturn;
}) {
  const attention = useNeedsAttention(registration.name);
  return (
    <div
      className={`${className} ${attention ? ATTENTION_RING : ""}`}
      data-field={registration.name}
    >
      {attention && <AttentionNote />}
      <label className="flex items-start gap-3">
        <input
          id={registration.name}
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-none rounded border-border text-charcoal focus:ring-gold"
          {...registration}
        />
        <span className="text-sm text-foreground/80">{label}</span>
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

export function StepSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="h3 text-charcoal">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
