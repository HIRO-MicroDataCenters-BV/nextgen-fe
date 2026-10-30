import { StorageSerializers } from "@vueuse/core";

/** Shown until real auth; not in i18n — `@` breaks message compilation (linked messages). */
const guestEmailPlaceholder = "guest@example.com";

/**
 * [UI Avatars](https://ui-avatars.com/) — free, no API key; initials on a solid background (works well in a circle).
 */
function buildUiAvatarsUrl(displayName: string): string {
  const name = displayName.trim() || "?";
  const params = new URLSearchParams({
    name,
    size: "128",
    background: "6366f1",
    color: "ffffff",
    bold: "true",
    format: "png",
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/** Use remote or data URL; otherwise generate via UI Avatars from name / email. */
function resolveAvatarUrl(
  name: string,
  email: string,
  stored: string | null | undefined,
): string {
  const a = stored?.trim() ?? "";
  if (/^https?:\/\//i.test(a) || a.startsWith("data:")) {
    return a;
  }
  const display =
    name.trim() ||
    (email.includes("@") ? (email.split("@")[0]?.trim() ?? "") : email.trim()) ||
    "?";
  return buildUiAvatarsUrl(display);
}

export interface AuthUserProfile {
  name: string;
  email: string;
  /** `https?://` or `data:` URL; empty = generated avatar */
  avatar: string;
  /** From the ds-login token (KERI sign-in); absent for older sessions. */
  role?: string;
  institute?: string;
  /** The KERI identifier (AID) that signed in. */
  aid?: string;
}

/** localStorage key of the ds-login JWT; services get it as a Bearer token. */
export const ACCESS_TOKEN_KEY = "access_token";

/**
 * Seconds-since-epoch expiry of a JWT, read without verifying it (the services
 * verify). `null` when the token is missing or unreadable.
 */
export function tokenExpiry(token: string | null | undefined): number | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** True when `token` is a JWT that has not expired yet (`now` in seconds). */
export function isTokenValid(token: string | null | undefined, now = Date.now() / 1000): boolean {
  const exp = tokenExpiry(token);
  return exp !== null && exp > now;
}

/**
 * localStorage key for the persisted profile. Route middleware and plugins read it via
 * `readStoredSignIn()` — they must NOT call `useAuthUser()`, which invokes `useI18n()`
 * and throws outside a component setup.
 */
export const AUTH_USER_KEY = "auth_user";

/**
 * Cookie mirror of the sign-in state. Not a credential — the profile stays in
 * localStorage — only a hint the server can read, so server-side route middleware and
 * the layout can tell guests (server-rendered landing) from signed-in users
 * (client-only shell) without seeing localStorage.
 */
export const AUTH_SESSION_COOKIE = "auth_session";

export const AUTH_SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;

/** Sign-in state as persisted in localStorage (client only). */
export function readStoredSignIn(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return Boolean(raw && (JSON.parse(raw) as AuthUserProfile | null)?.email);
  } catch {
    return false;
  }
}

/**
 * `false` until the client has hydrated. Until then the client must decide sign-in
 * state exactly as the server did — from `AUTH_SESSION_COOKIE` — or its first render
 * won't match the server HTML whenever the cookie and localStorage disagree (e.g. a
 * session that predates the cookie). Afterwards localStorage is the source of truth.
 * `plugins/auth-session.client.ts` flips this and reconciles the two.
 */
export const useAuthHydrated = () => useState("auth-hydrated", () => false);

/**
 * Where the guest/authenticated access rules send `path`, or `undefined` to stay.
 * Shared by the route middleware and the post-hydration reconciliation.
 */
export function authRedirectFor(
  path: string,
  signedIn: boolean,
): string | undefined {
  // The standalone /login page is retired — always bounce off it.
  if (path === "/login") return signedIn ? "/home" : "/";

  // Guests may see only the public landing at "/" (the tools catalogue). Everything
  // else — including /tools — redirects there so the guest URL stays a clean root.
  if (!signedIn) return path === "/" ? undefined : "/";

  // Signed in: the bare root goes to the home page.
  return path === "/" ? "/home" : undefined;
}

/**
 * Persisted profile for the signed-in user. After real auth, call `setAuthUser`
 * from the login response or a `/me` fetch; `logout` clears profile and token.
 */
export function useAuthUser() {
  const { t } = useI18n();
  // Use the JSON serializer explicitly: with a `null` default, useLocalStorage would
  // otherwise pick the pass-through serializer and persist the profile as "[object Object]".
  // flush: "sync" writes storage at once. The default waits for a watcher, and
  // logging out unmounts the component that owns it before it runs — the token
  // then stayed in localStorage after logout.
  const authUser = useLocalStorage<AuthUserProfile | null>(AUTH_USER_KEY, null, {
    serializer: StorageSerializers.object,
    flush: "sync",
  });

  const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null, { flush: "sync" });

  const user = computed(() => {
    const s = authUser.value;
    if (s?.email) {
      const name = s.name?.trim() || s.email.split("@")[0] || s.email;
      return {
        name,
        email: s.email,
        avatar: resolveAvatarUrl(name, s.email, s.avatar),
      };
    }
    const guestName = t("menu.guest_user");
    return {
      name: guestName,
      email: guestEmailPlaceholder,
      avatar: resolveAvatarUrl(guestName, guestEmailPlaceholder, null),
    };
  });

  const sessionCookie = useCookie<boolean | null>(
    AUTH_SESSION_COOKIE,
    AUTH_SESSION_COOKIE_OPTIONS,
  );
  const hydrated = useAuthHydrated();

  // Keep the cookie in step with login/logout and cross-tab changes. Deliberately not
  // `immediate`: writing it during hydration would change what the first client render
  // sees. The on-load reconciliation runs after hydration instead.
  if (import.meta.client) {
    watch(
      () => Boolean(authUser.value?.email),
      (signedIn) => {
        sessionCookie.value = signedIn ? true : null;
      },
    );
  }

  // The server and the hydrating client decide from the cookie, so they agree; once
  // hydrated, the client trusts localStorage.
  const isSignedIn = computed(() =>
    hydrated.value
      ? Boolean(authUser.value?.email)
      : sessionCookie.value === true,
  );

  function setAuthUser(profile: Partial<AuthUserProfile> & { email: string }) {
    const email = profile.email.trim();
    authUser.value = {
      email,
      name: (profile.name?.trim() || email.split("@")[0] || email).trim(),
      avatar: profile.avatar?.trim() ?? "",
      ...(profile.role ? { role: profile.role } : {}),
      ...(profile.institute ? { institute: profile.institute } : {}),
      ...(profile.aid ? { aid: profile.aid } : {}),
    };
  }

  function logout() {
    authUser.value = null;
    token.value = null;
  }

  const role = computed(() => authUser.value?.role ?? null);

  return {
    user,
    authUser,
    role,
    isSignedIn,
    setAuthUser,
    logout,
  };
}
