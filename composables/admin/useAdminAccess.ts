/**
 * Whether the signed-in user may see the Contracts page: role site_admin in
 * an unexpired ds-login token, read in the browser like the sidebar does.
 *
 * This only decides what to SHOW. The Clearing House does not check tokens
 * yet; when it does, it will be the one that refuses.
 */
import type { AdminIdentity } from "~/types/admin.types";
import { actorFromToken } from "~/composables/admin/useAdminApi";
import { ACCESS_TOKEN_KEY, isTokenValid, tokenClaims } from "~/composables/useAuthUser";

export const CONTRACTS_ROLE = "site_admin";

/** The site admin a ds-login token names, or null for anyone else. */
export function adminFromToken(
  token: string | null | undefined,
  now = Date.now() / 1000,
): AdminIdentity | null {
  if (!isTokenValid(token, now)) return null;
  const claims = tokenClaims(token);
  const actor = actorFromToken(token);
  if (!claims || !actor || claims.role !== CONTRACTS_ROLE) return null;
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    aid: text(claims.sub),
    name: text(claims.name),
    email: text(claims.email),
    institute: text(claims.institute),
    actor,
  };
}

export function useAdminAccess() {
  const config = useRuntimeConfig();
  const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null);

  /** False when this website has no Clearing House URL. */
  const configured = computed(() => Boolean(config.public.apiClearingHouseUrl));
  const identity = computed(() => adminFromToken(token.value));
  const isAdmin = computed(() => identity.value !== null);

  return { configured, identity, isAdmin };
}
