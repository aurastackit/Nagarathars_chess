import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

const inputClasses =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal disabled:cursor-not-allowed disabled:bg-background disabled:text-foreground/40";

function FieldShell({
  label,
  htmlFor,
  helper,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: FieldError;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      ) : (
        helper && <p className="mt-1 text-xs text-foreground/50">{helper}</p>
      )}
    </div>
  );
}

export function TextField({
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
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell
      label={label}
      htmlFor={registration.name}
      helper={helper}
      error={error}
      className={className}
    >
      <input id={registration.name} className={inputClasses} {...registration} {...props} />
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
      className={className}
    >
      <textarea
        id={registration.name}
        rows={2}
        className={inputClasses}
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
      className={className}
    >
      <select id={registration.name} className={inputClasses} {...registration} {...props}>
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
  return (
    <div className={className}>
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
      <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
