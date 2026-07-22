import { AUTH_USER_KEY, type AuthUserProfile } from "~/composables/useAuthUser";

/**
 * Guest vs authenticated access control.
 *
 * Auth lives in localStorage (client-only), so we never decide on the server —
 * it can't read the store and would treat every user as a guest, bouncing signed-in
 * users to /tools on every hard load. The guard runs on the client during hydration
 * (Nuxt 4 runs global middleware then), so hard loads / direct URLs are still gated
 * before the page renders.
 *
 * We read localStorage directly rather than via `useAuthUser()`, which calls
 * `useI18n()` and throws outside a component setup.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  let signedIn = false;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    signedIn = Boolean(raw && (JSON.parse(raw) as AuthUserProfile | null)?.email);
  } catch {
    signedIn = false;
  }

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
