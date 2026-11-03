/**
 * The Contracts page's client for the Clearing House.
 *
 * The browser calls the Clearing House directly, like the Credentials page
 * calls the issuer (NUXT_PUBLIC_API_CLEARING_HOUSE_URL). It sends the ds-login
 * JWT as a Bearer token. The Clearing House does not check it yet; it is sent
 * now so nothing here changes when it starts to. Every response is validated
 * before the page sees it (schemas/admin.schema.ts).
 */
import type { ZodType } from "zod";
import { ACCESS_TOKEN_KEY, tokenClaims } from "~/composables/useAuthUser";
import {
  auditEventListSchema,
  auditEventPageSchema,
  contractPageSchema,
  contractRecordSchema,
} from "~/schemas/admin.schema";
import type {
  AuditEventList,
  AuditEventPage,
  ContractPage,
  ContractRecord,
} from "~/types/admin.types";
import {
  CONTRACT_LIST_PARAMS,
  EVENT_LIST_PARAMS,
  isSafeJti,
  pickParams,
} from "~/utils/clearingHouseParams";

/** What went wrong, in terms the page can act on. */
export type AdminApiErrorKind =
  | "not_signed_in" // 401, or no signed-in identity to record as the actor
  | "forbidden" // 403
  | "bad_request" // 400 / 422, or a contract id that cannot be sent
  | "not_found" // 404
  | "conflict" // 409: the contract's status no longer allows the change
  | "unavailable" // no answer, or a 5xx: the Clearing House is down or unreachable
  | "invalid_response" // the answer did not match its schema
  | "failed"; // anything else

export class AdminApiError extends Error {
  constructor(
    public readonly kind: AdminApiErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export function classifyAdminError(status: number | undefined): AdminApiErrorKind {
  if (status === undefined) return "unavailable";
  if (status >= 500) return "unavailable";
  switch (status) {
    case 400:
    case 422:
      return "bad_request";
    case 401:
      return "not_signed_in";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return "failed";
  }
}

/**
 * Who a revoke is recorded as: keri:<AID> from the ds-login token. Taken from
 * the token, never typed in, so the history names whoever is signed in.
 */
export function actorFromToken(token: string | null | undefined): string | null {
  const sub = tokenClaims(token)?.sub;
  return typeof sub === "string" && sub && !/\s/.test(sub) ? `keri:${sub}` : null;
}

export function useAdminApi() {
  const config = useRuntimeConfig();
  const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null);

  const baseURL = () => String(config.public.apiClearingHouseUrl || "");

  function headers(): Record<string, string> {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  }

  // Every path that carries a contract id is built here. The Clearing House
  // decodes %2F before routing, so an id like "x/history" must be refused,
  // not just encoded (see isSafeJti).
  function contractPath(jti: string, suffix = ""): string {
    if (!isSafeJti(jti)) {
      throw new AdminApiError("bad_request", "Not a valid contract id", 400);
    }
    return `/v1/contracts/${encodeURIComponent(jti)}${suffix}`;
  }

  // Each caller passes a $fetch call with its concrete response type. Nuxt
  // types $fetch against its own route table, and a generic type there sends
  // the type checker into unbounded recursion.
  async function request<T>(
    fetcher: () => Promise<unknown>,
    schema: ZodType<T>,
  ): Promise<T> {
    if (!baseURL()) {
      throw new AdminApiError(
        "unavailable",
        "No Clearing House is configured (NUXT_PUBLIC_API_CLEARING_HOUSE_URL)",
      );
    }
    let raw: unknown;
    try {
      raw = await fetcher();
    } catch (error: unknown) {
      if (error instanceof AdminApiError) throw error;
      const err = error as {
        statusCode?: number;
        response?: { status?: number };
        data?: { detail?: unknown };
        message?: string;
      };
      const status = err.response?.status ?? err.statusCode;
      // FastAPI puts a message in `detail`: a string for 404/409, a list of
      // field errors for 422. Only a string makes a readable message.
      const detail = err.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : status === undefined
            ? "The Clearing House cannot be reached"
            : `The Clearing House answered HTTP ${status}`;
      throw new AdminApiError(classifyAdminError(status), message, status);
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      if (import.meta.dev) {
        console.warn("[contracts] unexpected response shape", parsed.error.flatten());
      }
      throw new AdminApiError(
        "invalid_response",
        "The Clearing House answered in an unexpected shape",
      );
    }
    return parsed.data;
  }

  const options = (query?: Record<string, string>) => ({
    baseURL: baseURL(),
    headers: headers(),
    query,
    // 5 s, matching the Contract Validator's own timeout to this service.
    timeout: 5000,
  });

  return {
    listContracts: (query: Record<string, string | number>): Promise<ContractPage> =>
      request(
        () =>
          $fetch<ContractPage>(
            "/v1/contracts",
            options(pickParams(query, CONTRACT_LIST_PARAMS)),
          ),
        contractPageSchema,
      ),

    getContract: (jti: string): Promise<ContractRecord> =>
      request(
        () => $fetch<ContractRecord>(contractPath(jti), options()),
        contractRecordSchema,
      ),

    getHistory: (jti: string): Promise<AuditEventList> =>
      request(
        () => $fetch<AuditEventList>(contractPath(jti, "/history"), options()),
        auditEventListSchema,
      ),

    // The Clearing House's status endpoint takes any status. This only ever
    // sends "revoked", so revoking is all the page can do with it.
    revokeContract: (jti: string, reason: string): Promise<ContractRecord> =>
      request(() => {
        const actor = actorFromToken(token.value);
        if (!actor) {
          throw new AdminApiError("not_signed_in", "Sign in again to revoke a contract");
        }
        return $fetch<ContractRecord>(contractPath(jti, "/status"), {
          ...options(),
          method: "PATCH",
          body: { status: "revoked", actor, reason: reason.trim() },
        });
      }, contractRecordSchema),

    listEvents: (query: Record<string, string | number>): Promise<AuditEventPage> =>
      request(
        () =>
          $fetch<AuditEventPage>(
            "/v1/audit/events",
            options(pickParams(query, EVENT_LIST_PARAMS)),
          ),
        auditEventPageSchema,
      ),
  };
}
