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
}

/**
 * localStorage key for the persisted profile. Exported so client-side route
 * middleware can read the sign-in state directly (it must NOT call `useAuthUser()`,
 * which invokes `useI18n()` and throws outside a component setup).
 */
export const AUTH_USER_KEY = "auth_user";

/**
 * Cookie mirror of the sign-in state. Not a credential — the profile stays in
 * localStorage — only a hint the server can read, so server-side route middleware and
 * the layout can tell guests (server-rendered landing) from signed-in users
 * (client-only shell) without seeing localStorage.
 */
export const AUTH_SESSION_COOKIE = "auth_session";

const AUTH_SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;

/**
 * Persisted profile for the signed-in user. After real auth, call `setAuthUser`
 * from the login response or a `/me` fetch; `logout` clears profile and token.
 */
export function useAuthUser() {
  const { t } = useI18n();
  // Use the JSON serializer explicitly: with a `null` default, useLocalStorage would
  // otherwise pick the pass-through serializer and persist the profile as "[object Object]".
  const authUser = useLocalStorage<AuthUserProfile | null>(AUTH_USER_KEY, null, {
    serializer: StorageSerializers.object,
  });

  const token = useLocalStorage<string | null>("access_token", null);

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

  // The server can't see localStorage, so it decides from the cookie. The client always
  // trusts localStorage and keeps the cookie in sync with it — on load (self-heals
  // sessions that predate the cookie), on login/logout, and on cross-tab changes.
  const sessionCookie = useCookie<boolean | null>(
    AUTH_SESSION_COOKIE,
    AUTH_SESSION_COOKIE_OPTIONS,
  );
  if (import.meta.client) {
    watch(
      () => Boolean(authUser.value?.email),
      (signedIn) => {
        sessionCookie.value = signedIn ? true : null;
      },
      { immediate: true },
    );
  }

  const isSignedIn = computed(() =>
    import.meta.server
      ? sessionCookie.value === true
      : Boolean(authUser.value?.email),
  );

  function setAuthUser(profile: Partial<AuthUserProfile> & { email: string }) {
    const email = profile.email.trim();
    authUser.value = {
      email,
      name: (profile.name?.trim() || email.split("@")[0] || email).trim(),
      avatar: profile.avatar?.trim() ?? "",
    };
  }

  function logout() {
    authUser.value = null;
    token.value = null;
  }

  return {
    user,
    authUser,
    isSignedIn,
    setAuthUser,
    logout,
  };
}
