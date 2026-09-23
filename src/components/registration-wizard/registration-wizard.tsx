"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRegistrationWizardSchema,
  REGISTRATION_STEPS,
  STEP_FIELDS,
  type RegistrationWizardOutput,
  type RegistrationWizardValues,
} from "@/lib/registration-schema";
import { useDraftAutosave, clearDraft } from "@/lib/use-draft-autosave";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { WizardProgressBar } from "@/components/registration-wizard/progress-bar";
import { PlayerStep } from "@/components/registration-wizard/steps/player-step";
import { CategoryStep } from "@/components/registration-wizard/steps/category-step";
import { FamilyStep } from "@/components/registration-wizard/steps/family-step";
import { CommunityStep } from "@/components/registration-wizard/steps/community-step";
import { DocumentsStep } from "@/components/registration-wizard/steps/documents-step";
import { ReviewStep } from "@/components/registration-wizard/steps/review-step";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

const DEFAULT_VALUES: Partial<RegistrationWizardValues> = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  city: "",
  address: "",
  ageCategory: "",
  rating: "",
  fideId: "",
  fatherName: "",
  motherName: "",
  fatherGrandparents: "",
  motherGrandparents: "",
  native: "",
  kovil: "",
  pirivu: "",
  motherNative: "",
  motherKovil: "",
  motherPirivu: "",
  sangamMember: false,
  ageProofType: "",
  ageProofKey: "",
  passportPhotoKey: "",
  consentAccepted: false,
  guardianName: "",
  guardianConsent: false,
};

export function RegistrationWizard({
  tournamentSlug,
  tournamentTitle,
  tournamentStartDate,
  entryFee,
}: {
  tournamentSlug: string;
  tournamentTitle: string;
  tournamentStartDate: Date;
  entryFee: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const storageKey = `registration-draft:${tournamentSlug}`;

  const schema = createRegistrationWizardSchema(tournamentStartDate);
  // The schema's input types are narrower than the raw HTML form state it
  // validates (e.g. `ageProofType` has no "" option, `dob` isn't a plain
  // string) — cast the resolver rather than fight zod's inference for that.
  const resolver = zodResolver(schema) as unknown as Resolver<
    RegistrationWizardValues,
    unknown,
    RegistrationWizardOutput
  >;
  const methods = useForm<RegistrationWizardValues, unknown, RegistrationWizardOutput>({
    resolver,
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });
  const { handleSubmit, trigger, watch, reset } = methods;

  useDraftAutosave({
    storageKey,
    watch,
    reset,
    skipKeys: ["ageProofKey", "passportPhotoKey"],
  });

  const isLastStep = step === REGISTRATION_STEPS.length - 1;

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, REGISTRATION_STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function payAndFinish(id: string) {
    const orderRes = await fetch(`/api/tournaments/${tournamentSlug}/pay/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: id }),
    });
    if (!orderRes.ok) {
      const body = await orderRes.json().catch(() => null);
      throw new Error(body?.error ?? "Could not start payment");
    }
    const order = await orderRes.json();
    const values = watch();

    const paymentResult = await openRazorpayCheckout({
      keyId: order.keyId,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Nagarathar's Chess Championship",
      description: tournamentTitle,
      prefill: { name: values.fullName, email: values.email, contact: values.phone },
    });

    const verifyRes = await fetch(`/api/tournaments/${tournamentSlug}/pay/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: id, ...paymentResult }),
    });
    if (!verifyRes.ok) {
      const body = await verifyRes.json().catch(() => null);
      throw new Error(body?.error ?? "Payment verification failed");
    }
  }

  async function onSubmit(values: RegistrationWizardOutput, event?: React.BaseSyntheticEvent) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const form = event?.target instanceof HTMLFormElement ? event.target : null;
      const honeypot = form ? String(new FormData(form).get(HONEYPOT_FIELD) ?? "") : "";
      let id = registrationId;
      if (!id) {
        const res = await fetch(`/api/tournaments/${tournamentSlug}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, [HONEYPOT_FIELD]: honeypot }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Something went wrong. Please try again.");
        }
        const body = await res.json();
        id = body.id as string;
        setRegistrationId(id);
      }

      if (entryFee > 0) {
        await payAndFinish(id);
      }

      clearDraft(storageKey);
      router.push(`/registration/${id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <WizardProgressBar current={step} steps={REGISTRATION_STEPS} />

        <form
          onSubmit={isLastStep ? handleSubmit(onSubmit) : (e) => e.preventDefault()}
          className="mt-8 space-y-8"
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
          {step === 0 && <PlayerStep />}
          {step === 1 && <CategoryStep tournamentStartDate={tournamentStartDate} />}
          {step === 2 && <FamilyStep />}
          {step === 3 && <CommunityStep />}
          {step === 4 && <DocumentsStep tournamentSlug={tournamentSlug} />}
          {step === 5 && <ReviewStep onEditStep={setStep} />}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="rounded-md border border-charcoal px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {isLastStep ? (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-gold px-6 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? entryFee > 0
                    ? "Processing payment…"
                    : "Submitting…"
                  : entryFee > 0
                    ? `Pay ₹${entryFee} & Register`
                    : "Submit Registration"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="rounded-md bg-charcoal px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-charcoal/90"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
