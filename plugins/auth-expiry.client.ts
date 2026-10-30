import { StorageSerializers } from "@vueuse/core";
import {
  ACCESS_TOKEN_KEY,
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_COOKIE_OPTIONS,
  AUTH_USER_KEY,
  isTokenValid,
  type AuthUserProfile,
} from "~/composables/useAuthUser";

/**
 * Ends the session when the ds-login token is gone or expired (tokens live 15
 * minutes; there is no refresh). Only with real KERI sign-in configured
 * (NUXT_PUBLIC_DS_LOGIN_URL): a profile without a valid token is then not a
 * session — this also signs out sessions left over from the old mock login.
 *
 * Checks after hydration, every 20 s, and whenever the tab becomes visible.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!useRuntimeConfig().public.dsLoginUrl) return;

  // Same keys as useAuthUser(), so its refs see the change in this tab too.
  const authUser = useLocalStorage<AuthUserProfile | null>(AUTH_USER_KEY, null, {
    serializer: StorageSerializers.object,
    flush: "sync",
  });
  const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null, { flush: "sync" });
  const sessionCookie = useCookie<boolean | null>(AUTH_SESSION_COOKIE, AUTH_SESSION_COOKIE_OPTIONS);
  const router = useRouter();

  function check() {
    if (!authUser.value?.email || isTokenValid(token.value)) return;
    const hadToken = Boolean(token.value);
    authUser.value = null;
    token.value = null;
    sessionCookie.value = null;
    // The Toaster lives in the layout, which switches from signed-in to guest
    // here; a toast sent before that switch is lost, so show it afterwards.
    router.replace("/").then(() => {
      if (!hadToken) return;
      const i18n = nuxtApp.$i18n as { t: (key: string) => string };
      setTimeout(() => useToaster().show("info", i18n.t("login.session_expired")), 300);
    });
  }

  nuxtApp.hooks.hookOnce("app:suspense:resolve", () => {
    check();
    setInterval(check, 20_000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  });
});
