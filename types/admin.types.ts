/**
 * Shapes returned by the admin API (server/api/admin/*), which passes the
 * Clearing House's responses through unchanged. Shared by the server routes
 * and the admin page.
 */

export type ContractStatus = "active" | "completed" | "cancelled" | "revoked";

export interface ContractRecord {
  jti: string;
  order_id: string;
  status: ContractStatus;
  consumer_id: string;
  /** Unix seconds, from the token. */
  iat: number;
  /** Unix seconds. A contract can be "active" and already past this. */
  exp: number;
  registered_at: number;
  status_changed_at: number;
}

/** A page of a list. Pages count from 1. */
export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export type ContractPage = Page<ContractRecord>;

export interface AuditEventRecord {
  /** Position in the ledger; the order things were recorded in. */
  seq: number;
  event_type: string;
  jti: string | null;
  order_id: string | null;
  /** Who the contract is for. */
  consumer_id: string | null;
  /** Who acted on it — "source:identity". A claim, not a verified fact. */
  actor: string | null;
  reason: string | null;
  from_status: ContractStatus | null;
  to_status: ContractStatus | null;
  occurred_at: number;
  detail: string | null;
}

/** One contract's whole history. Not paged. */
export interface AuditEventList {
  items: AuditEventRecord[];
}

export type AuditEventPage = Page<AuditEventRecord>;

/** Who the admin API thinks is asking. */
export interface AdminIdentity {
  email: string;
  /** What gets recorded as `actor` on everything this admin does. */
  actor: string;
}
