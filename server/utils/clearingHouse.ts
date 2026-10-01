/**
 * Server-side client for the Clearing House.
 *
 * Only server/api/admin/* calls this, and only after requireAdmin(). The
 * browser never reaches the Clearing House directly: it has no authentication
 * of its own and must stay inside the cluster, so this server is its only
 * door. That is also why its URL is server-only runtime config, not public.
 */
import type {
  AuditEventList,
  AuditEventPage,
  ContractPage,
  ContractRecord,
} from "~/types/admin.types";

/**
 * Query parameters each list endpoint understands. Anything else the browser
 * sends is dropped, so what this proxy forwards is written down here rather
 * than being whatever a caller happens to try.
 */
export const CONTRACT_LIST_PARAMS = [
  "status",
  "consumer_id",
  "order_id",
  "expired",
  "sort",
  "direction",
  "page",
  "limit",
] as const;

export const EVENT_LIST_PARAMS = [
  "event_type",
  "jti",
  "order_id",
  "consumer_id",
  "actor",
  "from_status",
  "to_status",
  "since",
  "until",
  "page",
  "limit",
] as const;

export function pickParams(
  query: Record<string, unknown>,
  allowed: readonly string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of allowed) {
    const raw = query[key];
    // A repeated parameter (?status=a&status=b) arrives as an array. None of
    // these endpoints accepts more than one value, so the first one wins.
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value === null || String(value) === "") {
      continue;
    }
    picked[key] = String(value);
  }
  return picked;
}

/**
 * A contract id the admin API will pass upstream.
 *
 * Percent-encoding the id is NOT enough on its own: the Clearing House decodes
 * %2F back into "/" before routing, so an id of "x/history" would reach the
 * history endpoint, and "../status" the status one. Refusing such ids is the
 * only defence that holds. Real ids are UUIDs from the Contract Generator;
 * this also admits the short ids used in tests, and caps at 64 characters,
 * the Clearing House's own column width.
 */
const SAFE_JTI = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function isSafeJti(jti: string): boolean {
  return SAFE_JTI.test(jti);
}

export interface UpstreamError {
  statusCode: number;
  statusMessage: string;
  data?: unknown;
}

/**
 * Translate a failed Clearing House call into what the browser should see.
 *
 * - No response at all: 502. The Clearing House is down or unreachable, which
 *   is this server's problem to report, not the browser's request being bad.
 * - 4xx: passed through. 400/404/409/422 are about the request — an unknown
 *   contract, a refused transition — and the page needs to know which.
 * - 5xx: 502, so the browser never mistakes an upstream failure for ours.
 */
export function describeUpstreamError(error: unknown): UpstreamError {
  const err = error as { response?: { status?: number }; data?: unknown };
  const status = err.response?.status;

  if (!status) {
    return { statusCode: 502, statusMessage: "Clearing House unreachable" };
  }
  if (status >= 500) {
    return {
      statusCode: 502,
      statusMessage: "Clearing House error",
      data: err.data,
    };
  }

  // FastAPI puts a message in `detail` — a string for 404/409, a list of
  // field errors for 422. Only a string makes a status line; the full body
  // goes in `data` either way, so nothing is lost.
  const detail = (err.data as { detail?: unknown } | undefined)?.detail;
  return {
    statusCode: status,
    statusMessage:
      typeof detail === "string" ? detail : "Clearing House rejected the request",
    data: err.data,
  };
}

export class ClearingHouseClient {
  // Read per call, not once at startup, so runtime overrides of
  // NUXT_CLEARING_HOUSE_URL take effect.
  private options(query?: Record<string, string>) {
    return {
      baseURL: useRuntimeConfig().clearingHouseUrl,
      query,
      // 5 s, matching the Contract Validator's own timeout to this service.
      timeout: 5000,
    };
  }

  // Each method calls $fetch with its concrete response type rather than
  // through one generic helper: Nitro types $fetch against its own route
  // table, and a generic type there sends the type checker into unbounded
  // recursion. Only the error handling is shared.
  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error: unknown) {
      throw createError(describeUpstreamError(error));
    }
  }

  listContracts(query: Record<string, unknown>): Promise<ContractPage> {
    const params = pickParams(query, CONTRACT_LIST_PARAMS);
    return this.call(() =>
      $fetch<ContractPage>("/v1/contracts", this.options(params)),
    );
  }

  // Every upstream path that carries a contract id is built here, so the
  // check in isSafeJti cannot be skipped by a method that forgets it.
  private contractPath(jti: string, suffix = ""): string {
    if (!isSafeJti(jti)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Not a valid contract id",
      });
    }
    return `/v1/contracts/${encodeURIComponent(jti)}${suffix}`;
  }

  getContract(jti: string): Promise<ContractRecord> {
    const path = this.contractPath(jti);
    return this.call(() => $fetch<ContractRecord>(path, this.options()));
  }

  getHistory(jti: string): Promise<AuditEventList> {
    const path = this.contractPath(jti, "/history");
    return this.call(() => $fetch<AuditEventList>(path, this.options()));
  }

  // The Clearing House's status endpoint takes any status. This only ever
  // sends "revoked", so revoking is all the admin API can do with it.
  revokeContract(
    jti: string,
    change: { actor: string; reason: string },
  ): Promise<ContractRecord> {
    const path = this.contractPath(jti, "/status");
    return this.call(() =>
      $fetch<ContractRecord>(path, {
        ...this.options(),
        method: "PATCH",
        body: { status: "revoked", actor: change.actor, reason: change.reason },
      }),
    );
  }

  listEvents(query: Record<string, unknown>): Promise<AuditEventPage> {
    const params = pickParams(query, EVENT_LIST_PARAMS);
    return this.call(() =>
      $fetch<AuditEventPage>("/v1/audit/events", this.options(params)),
    );
  }
}

export const clearingHouse = new ClearingHouseClient();
