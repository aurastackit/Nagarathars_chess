export const AGE_CATEGORIES = [
  { value: "under_11", label: "Under 11" },
  { value: "11_to_18", label: "Under 19" },
  { value: "above_19", label: "Above 19" },
] as const;

export const AGE_CATEGORY_VALUES = AGE_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export type AgeCategoryValue = (typeof AGE_CATEGORIES)[number]["value"];

export function ageCategoryLabel(value: string | null | undefined) {
  return AGE_CATEGORIES.find((c) => c.value === value)?.label ?? "—";
}

/**
 * A player's age for tournament purposes: whole calendar years between the
 * year of birth and the year of `at`. Only the year of birth is collected, so
 * months and days are deliberately ignored.
 */
export function ageByYear(birthYear: number, at: Date) {
  return at.getUTCFullYear() - birthYear;
}

/**
 * Whether a player might be under 18 today. With only the birth year known,
 * anyone turning 18 this year could still be 17, so they count as a minor
 * (and need a guardian's consent) to stay on the safe side.
 */
export function mightBeMinor(birthYear: number, now: Date = new Date()) {
  return ageByYear(birthYear, now) <= 18;
}

export function naturalAgeCategory(age: number): AgeCategoryValue {
  if (age <= 10) return "under_11";
  if (age <= 18) return "11_to_18";
  return "above_19";
}

/**
 * The span of ages (in the tournament year) that land in a category, as text.
 * Worked out by asking naturalAgeCategory, so what players read can never
 * drift from the rule that actually assigns their category.
 */
export function ageRangeLabel(value: AgeCategoryValue) {
  const MAX_AGE = 120;
  const ages = Array.from({ length: MAX_AGE + 1 }, (_, age) => age).filter(
    (age) => naturalAgeCategory(age) === value
  );
  const first = ages[0];
  const last = ages[ages.length - 1];
  if (first === 0) return `Up to ${last} years`;
  if (last === MAX_AGE) return `${first} years and above`;
  return `${first} to ${last} years`;
}
