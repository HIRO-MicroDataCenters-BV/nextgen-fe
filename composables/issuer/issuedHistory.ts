import type { IssueCredentialResponse } from "~/types/issuer.types";
import { grantClaims } from "./credentialIssuerClient";

/**
 * Credentials issued from this browser. The issuer has no list endpoint yet
 * (GET /credentials returns 501), so the "Issued" tab keeps its own record in
 * localStorage. Replace with the issuer's list once it exists.
 */

export const ISSUED_HISTORY_KEY = "nextgen.credentials.issued";
export const ISSUED_HISTORY_LIMIT = 200;

export interface IssuedEntry {
  said: string;
  issuerAid: string;
  subjectAid: string;
  role: string;
  institute: string;
  name: string;
  email: string;
  /** Entries saved before the form sent "institute" (read-only fallback). */
  org?: string;
  /** issue time from the ACDC (ISO 8601) */
  issuedAt: string;
  grant: IssueCredentialResponse["grant"];
}

export const toIssuedEntry = (
  issued: IssueCredentialResponse,
  now: Date = new Date(),
): IssuedEntry => {
  const claims = grantClaims(issued.grant);
  const flat = (issued.grant.acdc.a ?? {}) as Record<string, unknown>;
  return {
    said: issued.said,
    issuerAid: issued.issuer_aid,
    subjectAid: issued.subject_aid,
    role: String(claims.role ?? ""),
    institute: String(claims.institute ?? claims.org ?? ""),
    name: String(claims.name ?? ""),
    email: String(claims.email ?? ""),
    // dkms-bin credentials carry no `dt`; then use when it was issued here.
    issuedAt: String(claims.dt ?? flat.dt ?? now.toISOString()),
    grant: issued.grant,
  };
};

/** Newest first, no duplicate SAIDs, at most `limit` entries. */
export const addIssuedEntry = (
  history: IssuedEntry[],
  entry: IssuedEntry,
  limit = ISSUED_HISTORY_LIMIT,
): IssuedEntry[] =>
  [entry, ...history.filter((item) => item.said !== entry.said)].slice(0, limit);

/** Entries from one issuer, so switching issuers does not mix records. */
export const entriesForIssuer = (history: IssuedEntry[], issuerAid: string) =>
  history.filter((item) => item.issuerAid === issuerAid);

export const summarizeIssued = (entries: IssuedEntry[], now = new Date()) => {
  const today = now.toISOString().slice(0, 10);
  return {
    total: entries.length,
    today: entries.filter((item) => item.issuedAt.startsWith(today)).length,
    holders: new Set(entries.map((item) => item.subjectAid)).size,
  };
};
