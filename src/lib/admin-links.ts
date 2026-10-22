/** Where "View" / "Open" for a registration goes in the admin: its detail page. */
export function registrationAdminHref(registrationId: string) {
  return `/admin/registrations/${registrationId}`;
}
