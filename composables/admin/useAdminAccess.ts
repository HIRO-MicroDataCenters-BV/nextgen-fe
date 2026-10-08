/**
 * Whether the signed-in user is an admin, as the server sees it.
 *
 * Asked once per signed-in user (key identifier, else email), via
 * GET /api/admin/me, and shared through
 * useState so the sidebar and the admin page agree without asking twice.
 * This only decides what to SHOW. The server enforces access on every admin
 * request regardless, so a wrong answer here can hide a link, never open one.
 */
import type { AdminIdentity } from "~/types/admin.types";
import { AdminApiError, useAdminApi } from "~/composables/admin/useAdminApi";

export type AdminAccessState =
  | "unknown" // not asked yet
  | "checking"
  | "admin"
  | "denied" // not signed in, or not on the admin list
  | "disabled" // development login switched off on this server
  | "error"; // could not find out

interface AdminAccess {
  /** Who was asked about: key identifier, else email. */
  user: string | null;
  state: AdminAccessState;
  identity: AdminIdentity | null;
}

export function useAdminAccess() {
  const access = useState<AdminAccess>("admin_access", () => ({
    user: null,
    state: "unknown",
    identity: null,
  }));
  const { authUser } = useAuthUser();
  const api = useAdminApi();

  // With the key login every user has the same email, so the key identifier
  // is what tells two users apart; the email is the fallback for email login.
  const currentUser = () => authUser.value?.aid ?? authUser.value?.email ?? null;

  async function refresh(): Promise<void> {
    const user = currentUser();
    if (!user) {
      access.value = { user: null, state: "denied", identity: null };
      return;
    }
    access.value = { user, state: "checking", identity: null };
    try {
      const identity = await api.me();
      // Ignore the answer if the user changed while we were asking.
      if (currentUser() === user) {
        access.value = { user, state: "admin", identity };
      }
    } catch (error: unknown) {
      if (currentUser() !== user) return;
      const kind = error instanceof AdminApiError ? error.kind : "failed";
      const state: AdminAccessState =
        kind === "forbidden" || kind === "not_signed_in"
          ? "denied"
          : kind === "disabled"
            ? "disabled"
            : "error";
      access.value = { user, state, identity: null };
    }
  }

  /** Ask the server, unless we already know about this exact user. */
  function ensureChecked(): void {
    const user = currentUser();
    // "Known" includes a check already in flight for this same user. A check
    // for a previous user is not a reason to wait: refresh() discards its
    // answer when it lands.
    const known = access.value.user === user && access.value.state !== "unknown";
    if (!known) void refresh();
  }

  const isAdmin = computed(
    () => access.value.state === "admin" && access.value.user === currentUser(),
  );

  return { access, isAdmin, refresh, ensureChecked };
}
