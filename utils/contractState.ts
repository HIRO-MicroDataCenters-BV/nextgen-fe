/**
 * How contracts are presented on the admin page. Plain functions, no Vue.
 */
import type { ContractRecord, ContractStatus } from "~/types/admin.types";

/**
 * What an admin sees for a contract. Status alone is not enough: a contract
 * can be `active` and already past its expiry — the Validator checks the two
 * separately — and showing that as a green "Active" would be actively
 * misleading. So it gets a state of its own.
 */
export type ContractDisplayState =
  | "active"
  | "expired"
  | "completed"
  | "cancelled"
  | "revoked";

export function contractDisplayState(
  contract: Pick<ContractRecord, "status" | "exp">,
  nowSeconds: number,
): ContractDisplayState {
  if (contract.status !== "active") {
    // A finished contract shows as finished. That it has also passed its
    // expiry is true, but no longer the interesting fact.
    return contract.status;
  }
  // RFC 7519: a token must not be accepted on or after its exp, so the
  // boundary second counts as expired — the same rule as the Clearing
  // House's own `expired` filter.
  return contract.exp <= nowSeconds ? "expired" : "active";
}

/** Enough of a contract id to tell rows apart; the full id stays one hover away. */
export function shortId(jti: string): string {
  return jti.length > 12 ? `${jti.slice(0, 8)}…` : jti;
}

// Select items cannot use "" as a value, so "no filter" has a name of its own.
export type StatusFilter = "all" | ContractStatus;
export type ExpiryFilter = "any" | "expired" | "not_expired";

export interface ContractFilters {
  status: StatusFilter;
  expiry: ExpiryFilter;
  consumerId: string;
  orderId: string;
}

export const NO_CONTRACT_FILTERS: Readonly<ContractFilters> = Object.freeze({
  status: "all",
  expiry: "any",
  consumerId: "",
  orderId: "",
});

/**
 * Query for GET /api/admin/contracts. Blank filters are left out entirely,
 * and `pageIndex` is the table's page counted from 0 — the API counts from 1.
 */
export function contractListQuery(
  filters: ContractFilters,
  pageIndex: number,
  limit: number,
): Record<string, string | number> {
  const query: Record<string, string | number> = { page: pageIndex + 1, limit };
  if (filters.status !== "all") query.status = filters.status;
  if (filters.expiry !== "any") {
    query.expired = filters.expiry === "expired" ? "true" : "false";
  }
  const consumerId = filters.consumerId.trim();
  if (consumerId) query.consumer_id = consumerId;
  const orderId = filters.orderId.trim();
  if (orderId) query.order_id = orderId;
  return query;
}
