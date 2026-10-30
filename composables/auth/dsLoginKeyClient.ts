import { signAsync } from "@noble/ed25519";
import {
  KeriLoginError,
  type KeriAuthClient,
  type KeriLoadedCredential,
  type KeriLoadedKey,
} from "./keriLogin";

/**
 * Real KERI sign-in against ds-login, without a wallet. The user picks two files:
 *
 *  - the **key file**: `dkms identifier export <alias>` — JSON with the
 *    identifier (AID) and `current_seed`, the Ed25519 signing seed in CESR qb64.
 *    It is read and used in the browser only; it is never sent anywhere.
 *  - the **credential**: the `grant.json` the operator issued (an IPEX grant).
 *    It holds no private key and is sent to ds-login.
 *
 * Sign-in: ds-login issues a nonce for the AID → the browser signs the raw nonce
 * bytes with the seed (Ed25519) → ds-login checks the signature against the AID's
 * current key at the trusted witness, then the credential, and returns a JWT.
 * No Nuxt imports, so it can be unit-tested with a fake fetch.
 */

export interface DsLoginSession {
  jwt: string;
  claims: Record<string, unknown>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** CESR qb64 identifiers (AIDs, SAIDs) and Ed25519 seeds are 44 base64url chars. */
const QB64_44 = /^[A-Za-z0-9_-]{44}$/;

const fromBase64Url = (text: string): Uint8Array => {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * The 32-byte Ed25519 seed inside a qb64 seed ("A…", 44 chars). Code "A" takes
 * one lead byte, so the decoded 33 bytes are one zero byte + the seed.
 */
export function seedFromQb64(qb64: string): Uint8Array {
  if (!qb64.startsWith("A") || !QB64_44.test(qb64)) {
    throw new KeriLoginError("invalid_key_file");
  }
  const raw = fromBase64Url(qb64);
  if (raw.length !== 33 || raw[0] !== 0) throw new KeriLoginError("invalid_key_file");
  return raw.slice(1);
}

/**
 * A 64-byte Ed25519 signature as CESR qb64 with code "0B": two lead zero bytes,
 * base64url, then the first two characters replaced by the code (88 chars).
 */
export function signatureToQb64(signature: Uint8Array): string {
  const padded = new Uint8Array(2 + signature.length);
  padded.set(signature, 2);
  return `0B${toBase64Url(padded).slice(2)}`;
}

/** Reads a `dkms identifier export` file. Throws `invalid_key_file` otherwise. */
export function readKeyFile(contents: string): { aid: string; seed: Uint8Array } {
  let parsed: { identifier?: unknown; current_seed?: unknown } | null;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new KeriLoginError("invalid_key_file");
  }
  const aid = parsed?.identifier;
  const seed = parsed?.current_seed;
  if (typeof aid !== "string" || !QB64_44.test(aid) || typeof seed !== "string") {
    throw new KeriLoginError("invalid_key_file");
  }
  return { aid, seed: seedFromQb64(seed) };
}

/**
 * Reads a credential grant: the grant itself, or the whole `POST /credentials`
 * answer (`{ said, grant, … }`). The subject AID sits at `acdc.a.i` (KERIpy) or
 * `acdc.a.a.i` (dkms-bin). Throws `invalid_credential_file` otherwise.
 */
export function readGrantFile(contents: string): {
  subjectAid: string;
  said: string | null;
  grant: Record<string, unknown>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new KeriLoginError("invalid_credential_file");
  }
  const outer = parsed as { grant?: unknown } | null;
  const grant = (outer && typeof outer === "object" && "grant" in outer
    ? outer.grant
    : parsed) as { acdc?: { d?: unknown; a?: { i?: unknown; a?: { i?: unknown } } } } | null;
  const attrs = grant?.acdc?.a;
  const subjectAid = typeof attrs?.a?.i === "string" ? attrs.a.i : attrs?.i;
  if (typeof subjectAid !== "string" || !QB64_44.test(subjectAid)) {
    throw new KeriLoginError("invalid_credential_file");
  }
  const said = typeof grant?.acdc?.d === "string" ? grant.acdc.d : null;
  return { subjectAid, said, grant: grant as Record<string, unknown> };
}

/** Turns ds-login's refusal reason into the error the sign-in screen shows. */
export function errorForReason(reason: string): KeriLoginError {
  if (/signature invalid/i.test(reason)) return new KeriLoginError("key_replaced", reason);
  if (/^credential rejected/i.test(reason)) {
    return new KeriLoginError("credential_rejected", reason.replace(/^credential rejected:\s*/i, ""));
  }
  if (/KEL unavailable|not resolvable/i.test(reason)) {
    return new KeriLoginError("witnesses_unavailable", reason);
  }
  return new KeriLoginError("unknown", reason);
}

export function createDsLoginKeyClient(options: {
  baseUrl: string;
  onSession?: (session: DsLoginSession) => void;
  fetch?: FetchLike;
  timeoutMs?: number;
}): KeriAuthClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));

  const post = async (path: string, body: unknown) => {
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
      });
    } catch {
      throw new KeriLoginError("not_available");
    }
    const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: response.status, json };
  };

  return {
    async parseKeyFile(fileName, contents): Promise<KeriLoadedKey> {
      const { aid, seed } = readKeyFile(contents);
      return { fileName, aid, material: seed };
    },

    async parseCredentialFile(fileName, contents): Promise<KeriLoadedCredential> {
      const { subjectAid, said, grant } = readGrantFile(contents);
      return { fileName, subjectAid, said, material: grant };
    },

    async requestChallenge(aid) {
      const { status, json } = await post("/login/challenge", { aid });
      if (status === 404) {
        throw new KeriLoginError("identity_not_found", String(json?.detail ?? ""));
      }
      if (status !== 200 || typeof json?.nonce_hex !== "string") {
        throw new KeriLoginError("not_available");
      }
      return { id: aid, nonce: json.nonce_hex };
    },

    async sign(key, challenge) {
      const nonce = Uint8Array.from(
        challenge.nonce.match(/../g) ?? [],
        (byte) => Number.parseInt(byte, 16),
      );
      const signature = await signAsync(nonce, key.material as Uint8Array);
      return signatureToQb64(signature);
    },

    async verify(aid, challenge, signature, credential) {
      const { status, json } = await post("/login/verify", {
        aid,
        nonce_hex: challenge.nonce,
        signature_qb64: signature,
        credential_grant: credential?.material,
      });
      if (status !== 200 || !json) throw new KeriLoginError("not_available");
      const claims = json.jwt_claims as Record<string, unknown> | null | undefined;
      if (!json.verified || typeof json.jwt !== "string" || !claims) {
        throw errorForReason(String(json.reason ?? ""));
      }
      options.onSession?.({ jwt: json.jwt, claims });
      return {
        name: String(claims.name ?? ""),
        email: String(claims.email ?? ""),
        role: String(claims.role ?? ""),
        institute: String(claims.institute ?? ""),
        aid,
      };
    },
  };
}
