export const ONBOARDED_COOKIE = "ironpixels_onboarded";

/**
 * Removes all per-user client state (onboarding cookie + cached localStorage data)
 * so a previous account's data can never leak into a newly authenticated session.
 */
export function clearClientSession() {
  if (typeof document !== "undefined") {
    document.cookie = `${ONBOARDED_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  if (typeof localStorage !== "undefined") {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("ironpixels_"))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
  }
}

/**
 * Marks the given user as onboarded. The cookie value is bound to the user ID,
 * so it is ignored by the middleware when a different account signs in.
 */
export function markOnboarded(userId: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${ONBOARDED_COOKIE}=${userId}; path=/; max-age=31536000; samesite=lax`;
  }
}
