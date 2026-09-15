import {
  AUTH_SESSION_COOKIE,
  AUTH_USER_KEY,
  type AuthUserProfile,
} from "~/composables/useAuthUser";

/**
 * Guest vs authenticated access control.
 *
 * The profile lives in localStorage, which the server can't read, so `useAuthUser()`
 * mirrors the sign-in state into a cookie (`AUTH_SESSION_COOKIE`). The server decides
 * from that cookie, so guests are redirected before anything renders and the guest
 * landing at "/" can be server-rendered. The client decides from localStorage (the
 * source of truth); `useAuthUser()` keeps the cookie in sync with it.
 *
 * We read localStorage directly rather than via `useAuthUser()`, which calls
 * `useI18n()` and throws outside a component setup.
 */
export default defineNuxtRouteMiddleware((to) => {
  const signedIn = import.meta.server
    ? useCookie<boolean | null>(AUTH_SESSION_COOKIE, { readonly: true }).value ===
      true
    : readStoredSignIn();

  // Use `path` (not route name — names carry the `___en` i18n suffix).
  const path = to.path;

  // The standalone /login page is retired — always bounce off it.
  if (path === "/login") return navigateTo(signedIn ? "/home" : "/");

  // Guests may see only the public landing at "/" (the tools catalogue). Everything
  // else — including /tools — redirects there so the guest URL stays a clean root.
  if (!signedIn) return path === "/" ? undefined : navigateTo("/");

  // Signed in: the bare root goes to the home page.
  if (path === "/") return navigateTo("/home");
});

function readStoredSignIn(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return Boolean(raw && (JSON.parse(raw) as AuthUserProfile | null)?.email);
  } catch {
    return false;
  }
}
