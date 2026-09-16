import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_COOKIE_OPTIONS,
  authRedirectFor,
  readStoredSignIn,
  useAuthHydrated,
} from "~/composables/useAuthUser";

/**
 * Hands the sign-in state over from the server's view to localStorage once hydration
 * is done. Until then the client renders and routes from `AUTH_SESSION_COOKIE`, exactly
 * like the server, so hydration matches even when the cookie and localStorage disagree
 * (e.g. a session created before the cookie existed). Afterwards the cookie is
 * re-synced to localStorage and, if that changed the sign-in state, the access rules
 * are re-applied to the current route.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const hydrated = useAuthHydrated();
  const sessionCookie = useCookie<boolean | null>(
    AUTH_SESSION_COOKIE,
    AUTH_SESSION_COOKIE_OPTIONS,
  );
  const router = useRouter();

  nuxtApp.hooks.hookOnce("app:suspense:resolve", () => {
    hydrated.value = true;

    const signedIn = readStoredSignIn();
    if ((sessionCookie.value === true) === signedIn) return;

    sessionCookie.value = signedIn ? true : null;
    const target = authRedirectFor(router.currentRoute.value.path, signedIn);
    if (target) router.replace(target);
  });
});
