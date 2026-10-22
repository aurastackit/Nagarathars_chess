/**
 * Feature flags, set at build time (NEXT_PUBLIC_* values are inlined into the
 * bundle, so changing one needs a rebuild / redeploy).
 *
 * CLASSES_ENABLED — online classes are planned but not offered yet. While off
 * (the default), the public site shows /classes as "Coming soon" with a
 * waitlist, no page queries class programmes, the enrol API returns 404 and
 * nothing implies classes are running. Turning it on restores the class
 * listings, filters, enrolment and the original wording everywhere. Admin
 * class management works either way.
 */
export const CLASSES_ENABLED = process.env.NEXT_PUBLIC_CLASSES_ENABLED === "true";
