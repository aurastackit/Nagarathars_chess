import { REGISTRATION_STEPS } from "@/lib/registration-schema";

export function WizardProgressBar({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        {REGISTRATION_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < current
                    ? "bg-gold text-charcoal"
                    : i === current
                      ? "bg-charcoal text-white"
                      : "bg-charcoal/10 text-charcoal/40"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </span>
              <span className={`hidden text-[11px] font-medium sm:block ${i === current ? "text-charcoal" : "text-foreground/40"}`}>
                {label}
              </span>
            </div>
            {i < REGISTRATION_STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 rounded-full ${i < current ? "bg-gold" : "bg-charcoal/10"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-foreground/50 sm:hidden">
        Step {current + 1} of {REGISTRATION_STEPS.length}: {REGISTRATION_STEPS[current]}
      </p>
    </div>
  );
}
