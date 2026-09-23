"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEnrollmentSchema, type EnrollmentInput } from "@/lib/validations";
import { WizardProgressBar } from "@/components/registration-wizard/progress-bar";
import { StepSection, TextAreaField, TextField } from "@/components/registration-wizard/fields";
import { CheckIcon } from "@/components/form-fields";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

const STEPS = ["Your details", "Confirm"] as const;

export function ClassEnrollWizard({ classSlug, level }: { classSlug: string; level: string }) {
  const fideRequired = level !== "beginner";
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollmentInput>({
    resolver: zodResolver(createEnrollmentSchema(fideRequired)),
    defaultValues: { fullName: "", email: "", phone: "", fideId: "", message: "" },
    mode: "onBlur",
  });

  async function goNext() {
    const valid = await trigger(["fullName", "email", "phone", "fideId"]);
    if (valid) setStep(1);
  }

  async function onSubmit(values: EnrollmentInput, event?: React.BaseSyntheticEvent) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const form = event?.target instanceof HTMLFormElement ? event.target : null;
      const honeypot = form ? String(new FormData(form).get(HONEYPOT_FIELD) ?? "") : "";
      const res = await fetch(`/api/classes/${classSlug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, [HONEYPOT_FIELD]: honeypot }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center">
        <CheckIcon className="mx-auto h-6 w-6 text-green-600" />
        <p className="mt-2 text-sm font-semibold text-green-800">
          Thanks! We&apos;ll reach out about this class shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <WizardProgressBar current={step} steps={STEPS} />
      <form
        onSubmit={step === 1 ? handleSubmit(onSubmit) : (e) => e.preventDefault()}
        className="mt-5 space-y-4"
      >
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
        {step === 0 && (
          <StepSection title="Your details">
            <TextField
              label="Full name"
              registration={register("fullName")}
              error={errors.fullName}
              required
              className="sm:col-span-2"
            />
            <TextField
              label="Email"
              type="email"
              registration={register("email")}
              error={errors.email}
              required
            />
            <TextField
              label="Phone"
              type="tel"
              registration={register("phone")}
              error={errors.phone}
              required
            />
            <TextField
              label={`FIDE ID${fideRequired ? "" : " (optional)"}`}
              registration={register("fideId")}
              error={errors.fideId}
              placeholder={fideRequired ? "Required for intermediate/advanced classes" : "Optional"}
              className="sm:col-span-2"
            />
          </StepSection>
        )}
        {step === 1 && (
          <StepSection title="Anything we should know?">
            <TextAreaField
              label="Message"
              registration={register("message")}
              error={errors.message}
              placeholder="Optional"
              className="sm:col-span-2"
            />
          </StepSection>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setStep(0)}
            disabled={step === 0 || submitting}
            className="rounded-md border border-charcoal px-4 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-charcoal px-4 py-2 text-xs font-semibold text-background transition-colors hover:bg-charcoal/90"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Enroll interest"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
