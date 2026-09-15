/**
 * Who may use the admin API.
 *
 * TEMPORARY — a development stand-in for real login. Today the login form
 * stores whatever email is typed and nothing verifies it (see LoginForm.vue).
 * Until Dex/OIDC is wired in, admins are an allowlist of emails in
 * NUXT_ADMIN_EMAILS, and the browser says who it is in an `x-user-email`
 * header, which anyone can forge. That is accepted for now, and contained:
 * every admin route calls requireAdmin(), nothing else decides, so this file
 * is the only one that changes when real login lands.
 *
 * The decision itself is a plain function, testable without a server.
 */
import type { H3Event } from "h3";
import type { AdminIdentity } from "~/types/admin.types";

export const ADMIN_EMAIL_HEADER = "x-user-email";

/**
 * Prefixed to every actor this stand-in produces. The Clearing House's ledger
 * is append-only, so recording how an identity was established is the only
 * way to later tell these entries apart from ones made after real login.
 */
export const DEV_ACTOR_SOURCE = "dev-allowlist";

export type AdminDecision =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; statusCode: 401 | 403 | 503; message: string };

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function decideAdmin(input: {
  email: string | undefined;
  allowlist: string[];
  production: boolean;
  allowDevAuthInProduction: boolean;
}): AdminDecision {
  // Fail closed in production. A production build running on this stand-in
  // would look governed while being open to anyone who can type an email, so
  // it has to be switched on deliberately — e.g. for a demo on a dev cluster.
  if (input.production && !input.allowDevAuthInProduction) {
    return {
      ok: false,
      statusCode: 503,
      message:
        "Admin access is disabled: development login is not allowed in production",
    };
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) {
    return { ok: false, statusCode: 401, message: "Not signed in" };
  }
  if (input.allowlist.length === 0) {
    return {
      ok: false,
      statusCode: 403,
      message: "No admins are configured (NUXT_ADMIN_EMAILS is empty)",
    };
  }
  if (!input.allowlist.includes(email)) {
    return { ok: false, statusCode: 403, message: "Not an admin" };
  }
  return {
    ok: true,
    identity: { email, actor: `${DEV_ACTOR_SOURCE}:${email}` },
  };
}

/** The identity of the admin making this request, or a 401/403/503. */
export function requireAdmin(event: H3Event): AdminIdentity {
  const config = useRuntimeConfig(event);
  const decision = decideAdmin({
    email: getHeader(event, ADMIN_EMAIL_HEADER),
    allowlist: parseAdminEmails(config.adminEmails),
    production: process.env.NODE_ENV === "production",
    allowDevAuthInProduction: config.allowDevAdminAuth === true,
  });

  if (!decision.ok) {
    // Refusals are logged: someone reaching for the admin API without being
    // an admin is worth seeing.
    console.warn(
      `[admin] ${decision.statusCode} ${event.path}: ${decision.message}`,
    );
    throw createError({
      statusCode: decision.statusCode,
      statusMessage: decision.message,
    });
  }
  return decision.identity;
}
