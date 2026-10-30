import type {
  CredentialDetail,
  CredentialSummary,
  IssueCredentialRequest,
  IssueCredentialResponse,
  IssuerInfo,
  RevokeCredentialResponse,
} from "~/types/issuer.types";

/**
 * Plain HTTP client for ds-credential-issuer (DKMS). No Nuxt imports, so it can
 * be unit-tested with a fake `fetch`; `useCredentialIssuer` wires it to the
 * runtime config.
 *
 * `baseUrl` is the issuer's public address; the browser calls it directly
 * (the issuer allows every website, CORS "*").
 */

/**
 * The roles a credential can carry (role@site). The issuer refuses any other
 * role; the policy engine maps each to permissions.
 */
export const CREDENTIAL_ROLES = [
  "researcher",
  "data_provider",
  "operator",
  "site_admin",
] as const;
export type CredentialRole = (typeof CREDENTIAL_ROLES)[number];

/**
 * Which roles the signed-in user may issue (and revoke) — the same rule the
 * issuer enforces: a site admin any role, an operator only data providers and
 * researchers, anyone else none.
 */
export function issuableRoles(myRole: string | null | undefined): CredentialRole[] {
  if (myRole === "site_admin") return [...CREDENTIAL_ROLES];
  if (myRole === "operator") return ["researcher", "data_provider"];
  return [];
}

/** May this role open the Credentials page (issue at all)? */
export const canIssueCredentials = (myRole: string | null | undefined): boolean =>
  issuableRoles(myRole).length > 0;

/** The claims of a grant's credential: dkms-bin nests them at acdc.a.a, KERIpy at acdc.a. */
export function grantClaims(grant: { acdc?: { a?: Record<string, unknown> } } | null | undefined): Record<string, unknown> {
  const a = grant?.acdc?.a ?? {};
  const inner = a.a;
  return inner && typeof inner === "object" ? (inner as Record<string, unknown>) : a;
}

export class CredentialIssuerError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CredentialIssuerError";
  }
}

/**
 * A KERI AID or SAID in CESR text form: 44 base64url characters, e.g.
 * "EHnYLZTcuf7RwNe0irrMcbP08-mabVFAYWXo1N9ye62h".
 */
export const isCesrIdentifier = (value: string): boolean =>
  /^[A-Za-z0-9_-]{44}$/.test(value.trim());

/**
 * FastAPI errors come as { detail: "text" } or, for invalid input,
 * { detail: [{ loc: ["body", "subject_aid"], msg: "Field required" }] }.
 */
export const readIssuerError = (body: unknown, fallback: string): string => {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item: { loc?: unknown[]; msg?: string }) => {
        const field = item.loc?.filter((part) => part !== "body").join(".");
        return field ? `${field}: ${item.msg}` : (item.msg ?? "");
      })
      .join("; ");
  }
  return fallback;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createCredentialIssuerClient(options: {
  baseUrl: string;
  /** The signed-in operator's ds-login JWT; minting needs `issuer:write`. */
  getToken?: () => string | null;
  fetch?: FetchLike;
  /** Give up after this long. An issuer that is down or unreachable can
   *  leave the request hanging; without a limit the page waits forever. */
  timeoutMs?: number;
}) {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? 8000;

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (!baseUrl) {
      throw new CredentialIssuerError(
        "Credential issuer URL is not configured (NUXT_PUBLIC_API_CREDENTIAL_ISSUER_URL).",
      );
    }
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(options.getToken?.() ? { Authorization: `Bearer ${options.getToken()}` } : {}),
          ...init?.headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new CredentialIssuerError("Credential issuer is not reachable.");
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const fallback =
        response.status === 401
          ? "Not signed in, or your session expired. Sign in again."
          : response.status === 403
            ? "Your role may not do this (site admins and operators only)."
            : `Credential issuer answered ${response.status}.`;
      throw new CredentialIssuerError(readIssuerError(body, fallback), response.status);
    }
    return body as T;
  };

  return {
    /** Who this issuer is; also tells us the service is up. */
    getIssuerInfo: () => request<IssuerInfo>("/health-check/"),

    /** Mint a credential and get it back wrapped as an IPEX grant. */
    issueCredential: (body: IssueCredentialRequest) =>
      request<IssueCredentialResponse>("/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),

    /** Everything this issuer issued, newest first, with revocation state.
     *  The issuer shows each caller what it may manage (issuer:read). */
    listCredentials: () => request<CredentialSummary[]>("/credentials"),

    /** One credential with its grant, for copy and download. */
    getCredential: (said: string) =>
      request<CredentialDetail>(`/credentials/${encodeURIComponent(said)}`),

    /** Revoke a credential. The issuer allows it for the roles the caller
     *  may issue (site_admin: all; operator: data_provider, researcher). */
    revokeCredential: (said: string, reason: string) =>
      request<RevokeCredentialResponse>(
        `/credentials/${encodeURIComponent(said)}/revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      ),
  };
}

export type CredentialIssuerClient = ReturnType<
  typeof createCredentialIssuerClient
>;
