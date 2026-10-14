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
import { Button } from "@/components/ui";

const DEFAULT_VALUES: Partial<RegistrationWizardValues> = {
  fullName: "",
  email: "",
  phone: "",
  birthYear: "",
  gender: "",
  city: "",
  address: "",
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
  sangamRelativeName: "",
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
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const storageKey = `registration-draft:${tournamentSlug}`;

  const schema = createRegistrationWizardSchema();
  // The schema's input types are narrower than the raw HTML form state it
  // validates (e.g. `ageProofType` has no "" option, `birthYear` is turned into
  // a number) — cast the resolver rather than fight zod's inference for that.
  const resolver = zodResolver(schema) as unknown as Resolver<
    RegistrationWizardValues,
    unknown,
    RegistrationWizardOutput
  >;
  const methods = useForm<RegistrationWizardValues, unknown, RegistrationWizardOutput>({
    resolver,
    defaultValues: DEFAULT_VALUES,
    // Checks a field when it's first left, then on every change, so a message
    // clears as soon as the value is fixed instead of lingering until the next blur.
    mode: "onTouched",
  });
  const { handleSubmit, trigger, watch, reset, setError, setValue, getValues, getFieldState } =
    methods;

  useDraftAutosave({
    storageKey,
    watch,
    reset,
    skipKeys: ["ageProofKey", "passportPhotoKey"],
  });

  const isLastStep = step === REGISTRATION_STEPS.length - 1;
  const [isAdvancing, setIsAdvancing] = useState(false);

  async function goNext() {
    // Guards against a fast double-click: the Documents step's "Next" and the
    // Review step's "Submit" button occupy the same screen position, so a
    // click that lands right after this step change would otherwise hit
    // "Submit" instead of "Next" and register before the user meant to.
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const fields = STEP_FIELDS[step];
      const valid = fields.length === 0 || (await trigger(fields));
      if (!valid) {
        // Count the fields that just failed as touched, so each one re-checks as
        // the player types (their messages would otherwise wait for a blur).
        for (const field of fields) {
          if (getFieldState(field).error) {
            setValue(field, getValues(field), { shouldTouch: true });
          }
        }
        return;
      }

      if (step === 0) {
        const email = watch("email").trim().toLowerCase();
        if (verifiedEmail !== email) {
          setError("email", {
            type: "manual",
            message: "Please verify your email before continuing",
          });
          return;
        }
      }

      setSubmitError(null);
      setStep((s) => Math.min(s + 1, REGISTRATION_STEPS.length - 1));
      // Keep the button disabled for one more tick after the step change so a
      // click already in flight can't land on the newly-rendered button.
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setIsAdvancing(false);
    }
  }

  function goBack() {
    setSubmitError(null);
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

        {/* noValidate: the form's own validation (below each field) is the only one, so
            the browser's pop-up bubbles never fight it. */}
        <form
          noValidate
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
          {step === 0 && (
            <PlayerStep verifiedEmail={verifiedEmail} onEmailVerified={setVerifiedEmail} />
          )}
          {step === 1 && <CategoryStep tournamentStartDate={tournamentStartDate} />}
          {step === 2 && <FamilyStep />}
          {step === 3 && <CommunityStep />}
          {step === 4 && <DocumentsStep tournamentSlug={tournamentSlug} />}
          {step === 5 && (
            <ReviewStep onEditStep={setStep} tournamentStartDate={tournamentStartDate} />
          )}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || submitting || isAdvancing}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={submitting || isAdvancing}>
                {submitting
                  ? entryFee > 0
                    ? "Processing payment…"
                    : "Submitting…"
                  : entryFee > 0
                    ? `Pay ₹${entryFee} & Register`
                    : "Submit Registration"}
              </Button>
            ) : (
              <Button type="button" variant="dark" onClick={goNext} disabled={isAdvancing}>
                Next
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
