import { useFormContext } from "react-hook-form";
import { AGE_CATEGORIES } from "@/lib/age-category";
import { AGE_PROOF_TYPES, type RegistrationWizardValues } from "@/lib/registration-schema";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-foreground/50">{label}</span>
      <span className="text-right font-medium text-foreground">{value === true ? "Yes" : value}</span>
    </div>
  );
}

function ReviewGroup({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-gold hover:underline">
          Edit
        </button>
      </div>
      <div className="mt-2 divide-y divide-border">{children}</div>
    </div>
  );
}

export function ReviewStep({ onEditStep }: { onEditStep: (step: number) => void }) {
  const { watch } = useFormContext<RegistrationWizardValues>();
  const v = watch();
  const dob = v.dob ? new Date(v.dob as unknown as string) : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal">Review your details</h3>

      <ReviewGroup title="Player" onEdit={() => onEditStep(0)}>
        <Row label="Full name" value={v.fullName} />
        <Row label="Email" value={v.email} />
        <Row label="Phone" value={v.phone} />
        <Row label="Date of birth" value={dob && !isNaN(dob.getTime()) ? dob.toLocaleDateString("en-IN") : undefined} />
        <Row label="Gender" value={v.gender} />
        <Row label="City" value={v.city} />
        <Row label="Address" value={v.address} />
      </ReviewGroup>

      <ReviewGroup title="Category" onEdit={() => onEditStep(1)}>
        <Row label="Age category" value={AGE_CATEGORIES.find((c) => c.value === v.ageCategory)?.label} />
        <Row label="Rating" value={v.rating} />
        <Row label="FIDE ID" value={v.fideId} />
      </ReviewGroup>

      <ReviewGroup title="Family" onEdit={() => onEditStep(2)}>
        <Row label="Father" value={v.fatherName} />
        <Row label="Mother" value={v.motherName} />
        <Row label="Father side grandparents" value={v.fatherGrandparents} />
        <Row label="Mother side grandparents" value={v.motherGrandparents} />
      </ReviewGroup>

      <ReviewGroup title="Community" onEdit={() => onEditStep(3)}>
        <Row label="Native" value={v.native} />
        <Row label="Kovil" value={v.kovil} />
        <Row label="Pirivu" value={v.pirivu} />
        <Row label="Mother native" value={v.motherNative} />
        <Row label="Mother Kovil" value={v.motherKovil} />
        <Row label="Mother Pirivu" value={v.motherPirivu} />
        <Row label="Sangam member" value={v.sangamMember} />
      </ReviewGroup>

      <ReviewGroup title="Documents" onEdit={() => onEditStep(4)}>
        <Row label="Age proof type" value={AGE_PROOF_TYPES.find((t) => t.value === v.ageProofType)?.label} />
        <Row label="Age proof uploaded" value={Boolean(v.ageProofKey)} />
        <Row label="Photo uploaded" value={Boolean(v.passportPhotoKey)} />
        <Row label="Guardian" value={v.guardianName} />
      </ReviewGroup>
    </div>
  );
}
