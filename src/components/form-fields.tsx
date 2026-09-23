import type { ChangeEvent, ReactNode } from "react";

export const fieldClasses =
  "w-full rounded-lg border border-[#d8cfa8] bg-[#fffdf8] px-3.5 py-2.5 text-sm text-[#12312d] focus:border-[#0e4f45] focus:outline-none focus:ring-2 focus:ring-[#c8922f]/40 disabled:cursor-not-allowed disabled:bg-[#f1eee2] disabled:text-[#8a8471]";

export function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#c8922f]/15 text-xs font-bold text-[#c8922f]">
          {index}
        </span>
        <h4 className="text-sm font-bold uppercase tracking-wide text-[#12312d]">{title}</h4>
      </div>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-full bg-[#0e4f45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b3d36] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

function FieldShell({
  label,
  htmlFor,
  helper,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#12312d]">
        {label}
      </label>
      {children}
      {helper && <p className="mt-1 text-xs text-[#8a8471]">{helper}</p>}
    </div>
  );
}

export function TextField({
  label,
  name,
  helper,
  className,
  ...props
}: {
  label: string;
  name: string;
  helper?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} htmlFor={name} helper={helper} className={className}>
      <input id={name} name={name} className={fieldClasses} {...props} />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  helper,
  className,
  ...props
}: {
  label: string;
  name: string;
  helper?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} htmlFor={name} helper={helper} className={className}>
      <textarea id={name} name={name} rows={2} className={fieldClasses} {...props} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  helper,
  className,
  children,
  ...props
}: {
  label: string;
  name: string;
  helper?: string;
  className?: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} htmlFor={name} helper={helper} className={className}>
      <select id={name} name={name} className={fieldClasses} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

export function FileField({
  label,
  name,
  required,
  helper,
  fileName,
  onFileChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  helper: string;
  fileName: string | null;
  onFileChange: (name: string | null) => void;
}) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onFileChange(e.target.files?.[0]?.name ?? null);
  }

  return (
    <FieldShell label={label} htmlFor={name} helper={helper}>
      <label
        htmlFor={name}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#c8922f]/50 bg-[#fbf6e9] px-3.5 py-3 text-sm text-[#0e4f45] transition-colors hover:bg-[#f6f1e3]"
      >
        <UploadIcon className="h-5 w-5 flex-none" />
        <span className="truncate">{fileName ?? "Click to choose a file"}</span>
      </label>
      <input
        id={name}
        name={name}
        type="file"
        required={required}
        onChange={handleChange}
        className="hidden"
      />
    </FieldShell>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" />
    </svg>
  );
}
