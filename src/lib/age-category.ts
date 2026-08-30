export const AGE_CATEGORIES = [
  { value: "under_11", label: "Under 11" },
  { value: "11_to_18", label: "Under 19" },
  { value: "above_19", label: "Above 19" },
] as const;

export const AGE_CATEGORY_VALUES = AGE_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export type AgeCategoryValue = (typeof AGE_CATEGORIES)[number]["value"];

const RANK: Record<AgeCategoryValue, number> = { under_11: 0, "11_to_18": 1, above_19: 2 };

export function ageCategoryLabel(value: string | null | undefined) {
  return AGE_CATEGORIES.find((c) => c.value === value)?.label ?? "—";
}

export function ageAt(dob: Date, at: Date) {
  let age = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) age--;
  return age;
}

export function naturalAgeCategory(age: number): AgeCategoryValue {
  if (age <= 10) return "under_11";
  if (age <= 18) return "11_to_18";
  return "above_19";
}

// Players may register in their own age category or any higher one, never lower.
export function isAgeCategoryAllowed(selected: AgeCategoryValue, natural: AgeCategoryValue) {
  return RANK[selected] >= RANK[natural];
}
