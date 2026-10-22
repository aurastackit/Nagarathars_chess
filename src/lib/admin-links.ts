/**
 * Where "View" / "Open" for a registration goes in the admin. Until the
 * registration detail page exists, that's the registration's row on its
 * tournament page (highlighted via the #reg-<id> anchor).
 */
export function registrationAdminHref(tournamentId: string, registrationId: string) {
  return `/admin/tournaments/${tournamentId}#reg-${registrationId}`;
}
