"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRegistrationWizardSchema,
  type RegistrationWizardOutput,
  type RegistrationWizardValues,
} from "@/lib/registration-schema";
import { buildRegisterPayload } from "@/lib/registration-payload";
import { AttentionProvider } from "@/components/registration-wizard/attention";
import { PlayerStep } from "@/components/registration-wizard/steps/player-step";
import { CategoryStep } from "@/components/registration-wizard/steps/category-step";
import { FamilyStep } from "@/components/registration-wizard/steps/family-step";
import { CommunityStep } from "@/components/registration-wizard/steps/community-step";
import { DocumentsStep } from "@/components/registration-wizard/steps/documents-step";
import { Button, buttonClasses } from "@/components/ui";

/**
 * A signed-in player updates their application: the same sections as the
 * registration form, pre-filled, on one page, with the fields the organisers'
 * note mentions outlined. Saving sends it (back) for review.
 */
export function EditRegistrationForm({
  registrationId,
  tournamentSlug,
  tournamentStartDate,
  initialValues,
  attention,
}: {
  registrationId: string;
  tournamentSlug: string;
  tournamentStartDate: string;
  initialValues: RegistrationWizardValues;
  attention: string[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const resolver = zodResolver(createRegistrationWizardSchema()) as unknown as Resolver<
    RegistrationWizardValues,
    unknown,
    RegistrationWizardOutput
  >;
  const methods = useForm<RegistrationWizardValues, unknown, RegistrationWizardOutput>({
    resolver,
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { handleSubmit, trigger, setError } = methods;

  // Show anything the stored application doesn't satisfy any more (e.g. rows from the old form).
  useEffect(() => {
    void trigger();
  }, [trigger]);

  async function onSubmit(values: RegistrationWizardOutput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/my-registrations/${registrationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegisterPayload(values, "")),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        router.push(`/my-registration?updated=${registrationId}`);
        router.refresh();
        return;
      }
      if (body?.signIn) {
        router.push(`/my-registration?r=${registrationId}`);
        return;
      }
      if (body?.field) {
        setError(body.field as keyof RegistrationWizardValues, {
          type: "server",
          message: body.error,
        });
      }
      setSubmitError(body?.error ?? "Something went wrong. Please try again.");
    } catch {
      setSubmitError("Couldn't reach the website — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <AttentionProvider fields={attention}>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <PlayerStep lockedEmail={initialValues.email} />
          <CategoryStep tournamentStartDate={new Date(tournamentStartDate)} />
          <FamilyStep />
          <CommunityStep />
          <DocumentsStep tournamentSlug={tournamentSlug} registrationId={registrationId} />

          {submitError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </p>
          )}
          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-card/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send for review"}
            </Button>
            <Link href="/my-registration" className={buttonClasses("outline")}>
              Cancel
            </Link>
            <p className="w-full text-xs text-foreground/60 sm:w-auto">
              The organisers review it again and you&apos;ll get an email.
            </p>
          </div>
        </form>
      </AttentionProvider>
    </FormProvider>
  );
}
