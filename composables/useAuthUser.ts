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
 * Persisted profile for the signed-in user. After real auth, call `setAuthUser`
 * from the login response or a `/me` fetch; `logout` clears profile and token.
 */
export function useAuthUser() {
  const { t } = useI18n();
  const authUser = useLocalStorage<AuthUserProfile | null>("auth_user", null);

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

  const isSignedIn = computed(() => Boolean(authUser.value?.email));

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
