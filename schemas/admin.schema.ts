import { z } from "zod";

/**
 * Runtime checks for what the admin API returns.
 *
 * The admin page talks to our own server, which passes the Clearing House's
 * responses through — so these catch the two services drifting apart. They
 * would have caught the switch from cursors to page numbers, for instance:
 * a page without `total` fails here instead of rendering "showing 1 to NaN".
 *
 * useAdminApi assigns each parsed result to the hand-written type in
 * types/admin.types.ts, so if a schema and its type disagree, the typecheck
 * fails there.
 */

const contractStatus = z.enum(["active", "completed", "cancelled", "revoked"]);
const unixSeconds = z.number().int().nonnegative();

export const contractRecordSchema = z.object({
  jti: z.string().min(1),
  order_id: z.string(),
  status: contractStatus,
  consumer_id: z.string(),
  iat: unixSeconds,
  exp: unixSeconds,
  registered_at: unixSeconds,
  status_changed_at: unixSeconds,
});

const pageFields = {
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
};

export const contractPageSchema = z.object({
  items: z.array(contractRecordSchema),
  ...pageFields,
});

export const auditEventRecordSchema = z.object({
  seq: z.number().int().positive(),
  event_type: z.string().min(1),
  jti: z.string().nullable(),
  order_id: z.string().nullable(),
  consumer_id: z.string().nullable(),
  actor: z.string().nullable(),
  reason: z.string().nullable(),
  from_status: contractStatus.nullable(),
  to_status: contractStatus.nullable(),
  occurred_at: unixSeconds,
  detail: z.string().nullable(),
});

export const auditEventListSchema = z.object({
  items: z.array(auditEventRecordSchema),
});

export const auditEventPageSchema = z.object({
  items: z.array(auditEventRecordSchema),
  ...pageFields,
});

export const adminIdentitySchema = z.object({
  email: z.string().min(1),
  actor: z.string().min(1),
});

/**
 * The one request the admin page sends rather than receives: revoking a
 * contract. Checked by the dialog, and again by the server route.
 *
 * The reason is required here although the Clearing House would accept none.
 * A revocation cannot be undone, and its history entry is where the next
 * admin will look for why. Trimmed and capped at 500 characters, the
 * Clearing House's own rule, so a reason it would refuse never gets that far.
 *
 * Only `reason`: anything else in the body, an `actor` included, is dropped.
 */
export const REVOKE_REASON_MAX = 500;

export const revokeRequestSchema = z.object({
  reason: z.string().trim().min(1).max(REVOKE_REASON_MAX),
});
