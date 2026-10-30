import type {
  CredentialSummary,
  IssueCredentialResponse,
} from "~/types/issuer.types";
import { grantClaims } from "./credentialIssuerClient";

/**
 * The Credentials page's list, as the issuer keeps it (GET /credentials):
 * every admin and operator sees the same list, including credentials made
 * outside this website (bootstrap, scripts).
 */
export interface IssuedEntry {
  said: string;
  subjectAid: string;
  role: string;
  institute: string;
  name: string;
  email: string;
  issuedAt: string;
  /** AID of whoever issued it, or "bootstrap" */
  issuedBy: string;
  state: "valid" | "revoked";
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
  /** False for credentials issued before the issuer stored grants. */
  hasGrant: boolean;
}

export const fromSummary = (credential: CredentialSummary): IssuedEntry => ({
  said: credential.said,
  subjectAid: credential.subject_aid,
  role: credential.role,
  institute: credential.institute,
  name: credential.name,
  email: credential.email,
  issuedAt: credential.issued_at,
  issuedBy: credential.issued_by,
  state: credential.status === "revoked" ? "revoked" : "valid",
  revokedAt: credential.revoked_at ?? null,
  revokedBy: credential.revoked_by ?? null,
  revokeReason: credential.revoke_reason ?? null,
  hasGrant: credential.has_grant,
});

/** When a just-issued credential was issued: its `dt`, or `now` for
 *  dkms-bin credentials, which carry none. */
export const issuedAtOf = (
  issued: IssueCredentialResponse,
  now: Date = new Date(),
): string => {
  const flat = (issued.grant.acdc.a ?? {}) as Record<string, unknown>;
  return String(grantClaims(issued.grant).dt ?? flat.dt ?? now.toISOString());
};

export type StatusFilter = "all" | "valid" | "revoked";

const matchesQuery = (entry: IssuedEntry, q: string) =>
  [entry.subjectAid, entry.said, entry.role, entry.institute, entry.name, entry.email].some(
    (value) => value.toLowerCase().includes(q),
  );

/** The list as shown: status filter first, then the search text. */
export const filterIssued = (
  entries: IssuedEntry[],
  filter: StatusFilter,
  query: string,
): IssuedEntry[] => {
  const q = query.trim().toLowerCase();
  return entries.filter(
    (entry) =>
      (filter === "all" || entry.state === filter) && (!q || matchesQuery(entry, q)),
  );
};

export const countByState = (entries: IssuedEntry[]) => ({
  all: entries.length,
  valid: entries.filter((entry) => entry.state === "valid").length,
  revoked: entries.filter((entry) => entry.state === "revoked").length,
});
