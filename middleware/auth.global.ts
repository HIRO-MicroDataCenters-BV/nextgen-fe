import {
  AUTH_SESSION_COOKIE,
  authRedirectFor,
  readStoredSignIn,
  useAuthHydrated,
} from "~/composables/useAuthUser";

/**
 * Guest vs authenticated access control (the rules live in `authRedirectFor`).
 *
 * The profile lives in localStorage, which the server can't read, so `useAuthUser()`
 * mirrors the sign-in state into a cookie (`AUTH_SESSION_COOKIE`). The server — and the
 * client until hydration is done — decide from that cookie: guests are redirected
 * before anything renders, the guest landing at "/" can be server-rendered, and the
 * client routes exactly like the server did, so its first render matches the server
 * HTML. After hydration the client decides from localStorage (the source of truth).
 *
 * Never call `useAuthUser()` here: it invokes `useI18n()` and throws outside a
 * component setup.
 */
export default defineNuxtRouteMiddleware((to) => {
  const signedIn = useAuthHydrated().value
    ? readStoredSignIn()
    : useCookie<boolean | null>(AUTH_SESSION_COOKIE, { readonly: true }).value ===
      true;

  // Use `path` (not route name — names carry the `___en` i18n suffix).
  const target = authRedirectFor(to.path, signedIn);
  if (target) return navigateTo(target);
});
