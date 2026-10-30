// Shapes of the ds-credential-issuer API (DKMS). Field names match the
// service's JSON exactly; see ds-credential-issuer/server/app/rest_api/api_models.py.

/** GET /health-check/ */
export interface IssuerInfo {
  status: string;
  issuer_aid: string;
  issuer_name: string;
}

/** POST /credentials request body */
export interface IssueCredentialRequest {
  /** AID the credential is about (the holder) */
  subject_aid: string;
  /** SAID of the ACDC schema (which kind of credential this is) */
  schema_said: string;
  /** The facts the credential states, e.g. { role, org } */
  attributes: Record<string, unknown>;
}

/** The ACDC itself: the signed statement */
export interface Acdc {
  v: string;
  /** SAID of this credential */
  d: string;
  /** issuer AID */
  i: string;
  /** schema SAID */
  s: string;
  /** attributes block: subject AID, issue time and the facts */
  a: {
    d: string;
    i: string;
    dt: string;
    [attribute: string]: unknown;
  };
}

/** The envelope the holder keeps and later presents to ds-login */
export interface IpexGrant {
  acdc: Acdc;
  /** issuer's signature over the ACDC (CESR qb64) */
  iss_sig: string;
  /** where a verifier can look up the issuer's key */
  iss_oobis: {
    witness_urls: string[];
    witness_aids: string[];
    registry_said: string | null;
    tel_witness_urls: string[];
  };
}

/** POST /credentials response */
export interface IssueCredentialResponse {
  said: string;
  issuer_aid: string;
  subject_aid: string;
  grant: IpexGrant;
}

/** GET /credentials: one credential this issuer issued */
export interface CredentialSummary {
  said: string;
  subject_aid: string;
  role: string;
  /** name, email and institute are empty for credentials issued before 30 Oct 2026 */
  institute: string;
  name: string;
  email: string;
  issued_at: string;
  /** AID of whoever issued it, or "bootstrap" */
  issued_by: string;
  status: "valid" | "revoked";
  revoked_at?: string | null;
  revoked_by?: string | null;
  revoke_reason?: string | null;
  /** Whether GET /credentials/{said} can return the grant */
  has_grant: boolean;
}

/** GET /credentials/{said}: one credential with its grant (null if issued
 *  before the issuer stored grants) */
export interface CredentialDetail extends CredentialSummary {
  grant: IpexGrant | null;
}

/** POST /credentials/{said}/revoke response */
export interface RevokeCredentialResponse {
  said: string;
  status: "revoked";
  revoked_at: string;
  revoked_by: string;
  reason: string;
  already_revoked: boolean;
  tel_anchored: boolean;
}
