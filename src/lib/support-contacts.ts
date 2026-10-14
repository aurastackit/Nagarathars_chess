export type SupportContact = { name: string; phone: string };

/**
 * People players can call about registration, shown in the briefing that
 * precedes the registration form. The section stays hidden while this list is
 * empty, so only add real, confirmed numbers (e.g. "+91 98765 43210").
 */
export const SUPPORT_CONTACTS: SupportContact[] = [];
