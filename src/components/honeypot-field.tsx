import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** Invisible to real users (and screen readers); bots that auto-fill every field trip it. */
export function HoneypotField() {
  return (
    <div className="hidden" aria-hidden="true">
      <label htmlFor={HONEYPOT_FIELD}>Leave this field blank</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
