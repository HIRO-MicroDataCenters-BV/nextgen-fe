import {
  KeriLoginError,
  type KeriAuthClient,
  type KeriLoadedKey,
} from "./keriLogin";

/**
 * Used outside development until the KERI backend exists: every call fails with
 * `not_available`, so production shows "Key sign-in isn't available yet" rather
 * than pretending to authenticate.
 */
export const unavailableKeriAuthClient: KeriAuthClient = {
  parseKeyFile: () => Promise.reject(new KeriLoginError("not_available")),
  requestChallenge: () => Promise.reject(new KeriLoginError("not_available")),
  sign: () => Promise.reject(new KeriLoginError("not_available")),
  verify: () => Promise.reject(new KeriLoginError("not_available")),
};

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Stable, identifier-shaped value derived from the file so the UI has something to show. */
async function mockAid(contents: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(contents),
  );
  return `E${toBase64Url(new Uint8Array(digest)).slice(0, 43)}`;
}

/**
 * DEV-ONLY stand-in for the KERI backend. It performs NO cryptography and verifies
 * nothing — it only walks the UI through its states.
 *
 * Any file that passes the flow's size / empty / text checks loads. The file name
 * picks a scenario:
 * - contains "invalid"  → invalid key file
 * - contains "replaced" → key replaced (fails at the verify step)
 * - contains "offline"  → witnesses unavailable (fails at the verify step)
 * - anything else       → signs in as a sample user
 */
export function createMockKeriAuthClient(delayMs = 600): KeriAuthClient {
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs));
  const fileNameByAid = new Map<string, string>();

  return {
    async parseKeyFile(fileName, contents): Promise<KeriLoadedKey> {
      if (/invalid/i.test(fileName)) {
        throw new KeriLoginError("invalid_key_file");
      }
      const aid = await mockAid(contents);
      fileNameByAid.set(aid, fileName);
      return { fileName, aid, material: null };
    },

    async requestChallenge() {
      await wait();
      return { id: "mock-challenge", nonce: "mock-nonce" };
    },

    async sign() {
      await wait();
      return "mock-signature";
    },

    async verify(aid) {
      await wait();
      const fileName = fileNameByAid.get(aid) ?? "";
      if (/replaced/i.test(fileName)) throw new KeriLoginError("key_replaced");
      if (/offline/i.test(fileName)) {
        throw new KeriLoginError("witnesses_unavailable");
      }
      return { name: "Pathfinder researcher", email: "researcher@pathfinder.example" };
    },
  };
}
