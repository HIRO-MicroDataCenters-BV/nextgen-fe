/**
 * Helpers for calling the Clearing House from the browser
 * (composables/admin/useAdminApi.ts). Plain functions, no Vue.
 */

/**
 * Query parameters each list endpoint understands. Anything else is dropped,
 * so what the page sends is written down here rather than being whatever a
 * caller happens to try.
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
 * A contract id the page will put in a Clearing House path.
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
