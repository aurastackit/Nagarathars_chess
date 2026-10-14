/**
 * The registration notice is a pop-up that is the only thing on a tournament
 * page until its declaration is accepted; accepting opens the full page.
 */

/** Where every "Register" button goes: the tournament page with the notice forced open. */
export function registerPath(slug: string) {
  return `/tournaments/${slug}?notice=1`;
}

/**
 * Name of the session cookie that records the notice was accepted for one
 * tournament, so refreshing the page or coming back doesn't repeat it. A
 * convenience flag, not a security control.
 */
export function registrationAckCookie(slug: string) {
  return `regack_${slug}`;
}
