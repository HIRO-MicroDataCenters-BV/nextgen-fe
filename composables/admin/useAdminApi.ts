/**
 * The admin page's client for server/api/admin/*.
 *
 * Sends the signed-in email in the x-user-email header, because that is what
 * the server's requireAdmin() checks until real login exists. Every response
 * is validated before the page sees it (schemas/admin.schema.ts).
 */
import type { ZodType } from "zod";
import {
  adminIdentitySchema,
  auditEventListSchema,
  auditEventPageSchema,
  contractPageSchema,
  contractRecordSchema,
} from "~/schemas/admin.schema";
import type {
  AdminIdentity,
  AuditEventList,
  AuditEventPage,
  ContractPage,
  ContractRecord,
} from "~/types/admin.types";

/** What went wrong, in terms the page can act on. */
export type AdminApiErrorKind =
  | "not_signed_in" // 401
  | "forbidden" // 403: signed in, not an admin
  | "disabled" // 503: the development login is switched off here
  | "unavailable" // 502: the Clearing House is down or unreachable
  | "not_found" // 404
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
  switch (status) {
    case 401:
      return "not_signed_in";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 502:
      return "unavailable";
    case 503:
      return "disabled";
    default:
      return "failed";
  }
}

export function useAdminApi() {
  const { authUser } = useAuthUser();

  function headers(): Record<string, string> {
    const email = authUser.value?.email;
    return email ? { "x-user-email": email } : {};
  }

  // Each caller passes a $fetch call with its concrete response type. Nuxt
  // types $fetch against its own route table, and a generic type there sends
  // the type checker into unbounded recursion — see server/utils/clearingHouse.ts.
  async function request<T>(
    fetcher: () => Promise<unknown>,
    schema: ZodType<T>,
  ): Promise<T> {
    let raw: unknown;
    try {
      raw = await fetcher();
    } catch (error: unknown) {
      const err = error as {
        statusCode?: number;
        response?: { status?: number };
        data?: { statusMessage?: string; message?: string };
        message?: string;
      };
      const status = err.response?.status ?? err.statusCode;
      const message =
        err.data?.statusMessage || err.data?.message || err.message || "Request failed";
      throw new AdminApiError(classifyAdminError(status), message, status);
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      if (import.meta.dev) {
        console.warn("[admin] unexpected response shape", parsed.error.flatten());
      }
      throw new AdminApiError(
        "invalid_response",
        "The server answered in an unexpected shape",
      );
    }
    return parsed.data;
  }

  const contractPath = (jti: string) =>
    `/api/admin/contracts/${encodeURIComponent(jti)}`;

  return {
    me: (): Promise<AdminIdentity> =>
      request(
        () => $fetch<AdminIdentity>("/api/admin/me", { headers: headers() }),
        adminIdentitySchema,
      ),

    listContracts: (query: Record<string, string | number>): Promise<ContractPage> =>
      request(
        () =>
          $fetch<ContractPage>("/api/admin/contracts", {
            headers: headers(),
            query,
          }),
        contractPageSchema,
      ),

    getContract: (jti: string): Promise<ContractRecord> =>
      request(
        () => $fetch<ContractRecord>(contractPath(jti), { headers: headers() }),
        contractRecordSchema,
      ),

    getHistory: (jti: string): Promise<AuditEventList> =>
      request(
        () =>
          $fetch<AuditEventList>(`${contractPath(jti)}/history`, {
            headers: headers(),
          }),
        auditEventListSchema,
      ),

    listEvents: (query: Record<string, string | number>): Promise<AuditEventPage> =>
      request(
        () =>
          $fetch<AuditEventPage>("/api/admin/events", {
            headers: headers(),
            query,
          }),
        auditEventPageSchema,
      ),
  };
}
