import { verifyAsync, getPublicKeyAsync } from "@noble/ed25519";
import { describe, expect, it, vi } from "vitest";
import {
  createDsLoginKeyClient,
  errorForReason,
  readGrantFile,
  readKeyFile,
  seedFromQb64,
  signatureToQb64,
} from "~/composables/auth/dsLoginKeyClient";
import { KeriLoginError, createKeriLoginFlow } from "~/composables/auth/keriLogin";

// Test vector made with Python `cryptography` (Ed25519 is deterministic), the
// same maths ds-login accepted on kind. The seed is bytes 1..32 — not a real key.
const SEED_QB64 = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8g";
const NONCE_HEX = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const SIG_QB64 =
  "0BCxH4nGb7PH0WwUvnV1P_o9OXGyY24JFhkM_MyH_WRvXczVWQd3FQHlRln-pS8Tx8ObOPGU8lrKi965UMpcZwgD";

const HOLDER = "EKt4aUZ2nK2-JXz6o6Oe8k6PvA8Fk-4ZzWbGdL0z6RqA";
const OTHER = "EOtherIdentity00000000000000000000000000000A";
const KEY_FILE = JSON.stringify({
  identifier: HOLDER,
  current_seed: SEED_QB64,
  next_seed: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  witnesses: [],
});
const GRANT = {
  acdc: { d: "ECred", i: "EIssuer", a: { d: "EAttr", a: { i: HOLDER, role: "researcher" } } },
  iss_sig: "0BB",
  iss_oobis: { witness_urls: [] },
};
const CLAIMS = { sub: HOLDER, name: "Riley", email: "riley@hus.example", role: "researcher", institute: "hiro" };

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const file = (name: string, contents: string) => new File([contents], name);
const hex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (b) => Number.parseInt(b, 16));

describe("CESR encoding", () => {
  it("reads the 32-byte seed out of a qb64 seed", () => {
    expect(Array.from(seedFromQb64(SEED_QB64))).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  });

  it.each(["", "Bxxx", "D" + SEED_QB64.slice(1), SEED_QB64.slice(0, 43)])("rejects seed %j", (bad) => {
    expect(() => seedFromQb64(bad)).toThrow(KeriLoginError);
  });

  it("signs exactly like Python cryptography and encodes as 0B qb64", async () => {
    const client = createDsLoginKeyClient({ baseUrl: "/x" });
    const key = await client.parseKeyFile("key.json", KEY_FILE);
    const sig = await client.sign(key, { id: HOLDER, nonce: NONCE_HEX });
    expect(sig).toBe(SIG_QB64);
    expect(sig).toHaveLength(88);
  });

  it("the signature verifies with the seed's public key", async () => {
    const seed = seedFromQb64(SEED_QB64);
    const raw = Uint8Array.from(atob(SIG_QB64.slice(2).replace(/-/g, "+").replace(/_/g, "/").padStart(88, "A")), (c) => c.charCodeAt(0)).slice(2);
    expect(await verifyAsync(raw, hex(NONCE_HEX), await getPublicKeyAsync(seed))).toBe(true);
    expect(signatureToQb64(raw)).toBe(SIG_QB64);
  });
});

describe("files", () => {
  it("reads a dkms export key file; the seed stays local material", () => {
    const { aid, seed } = readKeyFile(KEY_FILE);
    expect(aid).toBe(HOLDER);
    expect(seed).toHaveLength(32);
  });

  it.each([
    ["not json", "{"],
    ["no seed", JSON.stringify({ identifier: HOLDER })],
    ["bad identifier", JSON.stringify({ identifier: "x", current_seed: SEED_QB64 })],
  ])("rejects a key file with %s", (_, contents) => {
    expect(() => readKeyFile(contents)).toThrow(expect.objectContaining({ code: "invalid_key_file" }));
  });

  it("reads a grant (dkms-bin a.a.i) and a whole POST /credentials answer", () => {
    expect(readGrantFile(JSON.stringify(GRANT)).subjectAid).toBe(HOLDER);
    expect(readGrantFile(JSON.stringify({ said: "ECred", grant: GRANT })).said).toBe("ECred");
    const flat = { acdc: { d: "E1", a: { i: HOLDER } } };
    expect(readGrantFile(JSON.stringify(flat)).subjectAid).toBe(HOLDER);
  });

  it("rejects a file that is not a grant", () => {
    expect(() => readGrantFile(KEY_FILE)).toThrow(expect.objectContaining({ code: "invalid_credential_file" }));
  });
});

describe("errorForReason (ds-login refusals)", () => {
  it.each([
    ["Ed25519 signature invalid", "key_replaced"],
    ["credential rejected: credential ECred is revoked", "credential_rejected"],
    ["KEL unavailable: timeout", "witnesses_unavailable"],
    ["something else", "unknown"],
  ])("%s → %s", (reason, code) => {
    expect(errorForReason(reason).code).toBe(code);
  });

  it("keeps ds-login's words for a rejected credential", () => {
    expect(errorForReason("credential rejected: credential ECred is revoked").message).toBe("credential ECred is revoked");
  });
});

describe("sign-in against ds-login", () => {
  function setup(verifyBody: Record<string, unknown>, challengeStatus = 200) {
    const fetch = vi.fn(async (url: string, _init?: RequestInit) =>
      url.endsWith("/login/challenge")
        ? json(challengeStatus, challengeStatus === 200 ? { nonce_hex: NONCE_HEX } : { detail: "KEL not resolvable" })
        : json(200, verifyBody),
    );
    const onSession = vi.fn();
    const client = createDsLoginKeyClient({ baseUrl: "/ds-login/", fetch, onSession });
    return { fetch, onSession, flow: createKeriLoginFlow(client) };
  }

  it("signs the challenge in the browser, sends signature + grant, never the key", async () => {
    const { fetch, onSession, flow } = setup({ verified: true, reason: "ok", jwt: "a.b.c", jwt_claims: CLAIMS });
    await flow.loadFile(file("riley.key.json", KEY_FILE));
    await flow.loadCredentialFile(file("riley.grant.json", JSON.stringify(GRANT)));
    expect(flow.canSubmit.value).toBe(true);

    const profile = await flow.signIn();
    expect(profile).toEqual({ name: "Riley", email: "riley@hus.example", role: "researcher", institute: "hiro", aid: HOLDER });
    expect(onSession).toHaveBeenCalledWith({ jwt: "a.b.c", claims: CLAIMS });

    const [url, init] = fetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/ds-login/login/verify");
    const sent = JSON.parse(String(init.body));
    expect(sent).toEqual({ aid: HOLDER, nonce_hex: NONCE_HEX, signature_qb64: SIG_QB64, credential_grant: GRANT });
    const everything = fetch.mock.calls.map((c) => String(c[1]?.body)).join(" ");
    expect(everything).not.toContain(SEED_QB64);
    expect(everything).not.toContain("next_seed");
  });

  it("accepts a credential file bigger than the key-file limit (grants grow with the issuer KEL)", async () => {
    const { flow } = setup({});
    const big = { ...GRANT, iss_kel_cesr: "x".repeat(40 * 1024) };
    await flow.loadFile(file("k.json", KEY_FILE));
    await flow.loadCredentialFile(file("g.json", JSON.stringify(big)));
    expect(flow.errorCode.value).toBeNull();
    expect(flow.canSubmit.value).toBe(true);
  });

  it("needs both files before it can sign in", async () => {
    const { flow } = setup({});
    await flow.loadFile(file("k.json", KEY_FILE));
    expect(flow.canSubmit.value).toBe(false);
    expect(await flow.signIn()).toBeNull();
  });

  it("refuses a credential issued to another identity, before contacting ds-login", async () => {
    const { fetch, flow } = setup({});
    await flow.loadFile(file("k.json", KEY_FILE));
    const other = { ...GRANT, acdc: { ...GRANT.acdc, a: { a: { i: OTHER } } } };
    await flow.loadCredentialFile(file("g.json", JSON.stringify(other)));
    expect(flow.errorCode.value).toBe("credential_mismatch");
    expect(flow.credential.value).toBeNull();
    expect(flow.key.value?.aid).toBe(HOLDER);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("a revoked credential: shows ds-login's reason, keeps the key, drops the credential", async () => {
    const { flow } = setup({ verified: false, reason: "credential rejected: credential ECred is revoked" });
    await flow.loadFile(file("k.json", KEY_FILE));
    await flow.loadCredentialFile(file("g.json", JSON.stringify(GRANT)));
    expect(await flow.signIn()).toBeNull();
    expect(flow.errorCode.value).toBe("credential_rejected");
    expect(flow.errorDetail.value).toBe("credential ECred is revoked");
    expect(flow.key.value).not.toBeNull();
    expect(flow.credential.value).toBeNull();
  });

  it("an identity the witness doesn't know → identity_not_found", async () => {
    const { flow } = setup({}, 404);
    await flow.loadFile(file("k.json", KEY_FILE));
    await flow.loadCredentialFile(file("g.json", JSON.stringify(GRANT)));
    await flow.signIn();
    expect(flow.errorCode.value).toBe("identity_not_found");
  });

  it("a rotated-out key → key_replaced", async () => {
    const { flow } = setup({ verified: false, reason: "Ed25519 signature invalid" });
    await flow.loadFile(file("k.json", KEY_FILE));
    await flow.loadCredentialFile(file("g.json", JSON.stringify(GRANT)));
    await flow.signIn();
    expect(flow.errorCode.value).toBe("key_replaced");
  });

  it("ds-login unreachable → not_available, files kept for a retry", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("network");
    });
    const flow = createKeriLoginFlow(createDsLoginKeyClient({ baseUrl: "/ds-login", fetch }));
    await flow.loadFile(file("k.json", KEY_FILE));
    await flow.loadCredentialFile(file("g.json", JSON.stringify(GRANT)));
    await flow.signIn();
    expect(flow.errorCode.value).toBe("not_available");
    expect(flow.canRetry.value).toBe(true);
  });
});
