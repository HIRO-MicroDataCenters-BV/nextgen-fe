import { computed, ref, shallowRef } from "vue";

/**
 * KERI identity-key sign-in flow, kept free of Nuxt auto-imports so it can be
 * unit-tested in Node. The component (`AppKeyLoginForm`) owns presentation; this
 * module owns the sequence: read key file locally (and, when the client asks for
 * one, the credential file) → request challenge → sign on this device → server
 * verifies the signature against the identifier's current key state and checks
 * the credential.
 *
 * The private key material never leaves the browser: only the identifier (AID),
 * a signature and the credential (which holds no private key) are sent.
 */

export type KeriLoginErrorCode =
  | "invalid_key_file"
  | "invalid_credential_file"
  /** The credential was issued to another identifier than the key file's. */
  | "credential_mismatch"
  /** The identifier is not known to the trusted witness. */
  | "identity_not_found"
  | "empty_key_file"
  | "key_file_too_large"
  | "key_replaced"
  | "witnesses_unavailable"
  | "not_available"
  /** ds-login refused the credential; the reason is in `errorDetail`. */
  | "credential_rejected"
  | "unknown";

export class KeriLoginError extends Error {
  readonly code: KeriLoginErrorCode;

  constructor(code: KeriLoginErrorCode, message?: string) {
    super(message ?? code);
    this.name = "KeriLoginError";
    this.code = code;
  }
}

/** A key file parsed in the browser. `material` must never be sent anywhere. */
export interface KeriLoadedKey {
  fileName: string;
  /** Autonomic identifier the key belongs to. */
  aid: string;
  material: unknown;
}

/** A credential (IPEX grant) file parsed in the browser. Sent to the backend as is. */
export interface KeriLoadedCredential {
  fileName: string;
  /** Identifier the credential was issued to; must equal the key's AID. */
  subjectAid: string;
  said: string | null;
  material: unknown;
}

export interface KeriChallenge {
  id: string;
  nonce: string;
}

/** Profile of the account linked to the identifier, as returned by the backend. */
export interface KeriSignInProfile {
  name: string;
  email: string;
  role?: string;
  institute?: string;
  /** The identifier that signed in. */
  aid?: string;
}

/**
 * Seam for the real KERI backend. Implementations must throw `KeriLoginError`
 * for expected failures so the UI can show the matching message.
 */
export interface KeriAuthClient {
  /** Parse a key file locally. Must not send `contents` over the network. */
  parseKeyFile(fileName: string, contents: string): Promise<KeriLoadedKey>;
  /** Present when sign-in also needs a credential file (parsed locally too). */
  parseCredentialFile?(fileName: string, contents: string): Promise<KeriLoadedCredential>;
  requestChallenge(aid: string): Promise<KeriChallenge>;
  /** Sign the challenge on this device with the loaded key. */
  sign(key: KeriLoadedKey, challenge: KeriChallenge): Promise<string>;
  /** Backend checks the signature against the identifier's current key state. */
  verify(
    aid: string,
    challenge: KeriChallenge,
    signature: string,
    credential?: KeriLoadedCredential | null,
  ): Promise<KeriSignInProfile>;
}

export type KeriLoginStep = "challenge" | "sign" | "verify" | "session";

export const KERI_LOGIN_STEPS: readonly KeriLoginStep[] = [
  "challenge",
  "sign",
  "verify",
  "session",
];

export type KeriLoginStatus =
  | "idle"
  | "loading_file"
  | "ready"
  | "verifying"
  | "error";

export type KeriStepState = "done" | "active" | "pending";

/** Failures the user can retry with the same key file still loaded. */
const RETRYABLE_WITH_KEY: ReadonlySet<KeriLoginErrorCode> = new Set([
  "witnesses_unavailable",
  "not_available",
  "unknown",
]);

/** Failures caused by the credential, not the key: keep the key, ask for another credential. */
const CREDENTIAL_ERRORS: ReadonlySet<KeriLoginErrorCode> = new Set([
  "invalid_credential_file",
  "credential_mismatch",
  "credential_rejected",
]);

const toErrorCode = (error: unknown): KeriLoginErrorCode =>
  error instanceof KeriLoginError ? error.code : "unknown";

/** Key files are small; anything bigger is not one and is not worth reading. */
export const KERI_KEY_FILE_MAX_BYTES = 16 * 1024;

/**
 * Credential (grant) files carry the issuer's whole KEL, which gains an event
 * (~0.5 KB) for every credential the site issues, so they keep growing.
 */
export const KERI_CREDENTIAL_FILE_MAX_BYTES = 1024 * 1024;

/** Control characters a text key file may legitimately contain: tab, LF, CR. */
const ALLOWED_CONTROL_BYTES: ReadonlySet<number> = new Set([0x09, 0x0a, 0x0d]);

/**
 * Format-independent checks, run before any parsing: rejects files that are too
 * large (without reading them), empty or whitespace-only, or not text — binary
 * control bytes or invalid UTF-8. A leading UTF-8 BOM is dropped.
 */
export async function readKeyFileText(
  file: Pick<File, "size" | "arrayBuffer">,
  maxBytes = KERI_KEY_FILE_MAX_BYTES,
): Promise<string> {
  if (file.size > maxBytes) {
    throw new KeriLoginError("key_file_too_large");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > maxBytes) {
    throw new KeriLoginError("key_file_too_large");
  }

  for (const byte of bytes) {
    if ((byte < 0x20 && !ALLOWED_CONTROL_BYTES.has(byte)) || byte === 0x7f) {
      throw new KeriLoginError("invalid_key_file");
    }
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new KeriLoginError("invalid_key_file");
  }

  if (!text.trim()) throw new KeriLoginError("empty_key_file");
  return text;
}

export function createKeriLoginFlow(client: KeriAuthClient) {
  const status = ref<KeriLoginStatus>("idle");
  const key = shallowRef<KeriLoadedKey | null>(null);
  const credential = shallowRef<KeriLoadedCredential | null>(null);
  /** The client signs in with key + credential, not the key alone. */
  const needsCredential = Boolean(client.parseCredentialFile);
  const currentStep = ref<KeriLoginStep | null>(null);
  const errorCode = ref<KeriLoginErrorCode | null>(null);
  /** The backend's own words for a refusal, when it gave any. */
  const errorDetail = ref<string | null>(null);

  const canSubmit = computed(
    () =>
      status.value === "ready" &&
      !!key.value &&
      (!needsCredential || !!credential.value),
  );
  const canRetry = computed(
    () =>
      status.value === "error" &&
      !!key.value &&
      !!errorCode.value &&
      RETRYABLE_WITH_KEY.has(errorCode.value),
  );

  function fail(error: unknown) {
    const code = toErrorCode(error);
    errorCode.value = code;
    errorDetail.value =
      error instanceof KeriLoginError && error.message !== code ? error.message : null;
    currentStep.value = null;
    // Keep a file only when retrying with it makes sense; otherwise ask for a new one.
    if (CREDENTIAL_ERRORS.has(code)) credential.value = null;
    else if (!RETRYABLE_WITH_KEY.has(code)) key.value = null;
    status.value = "error";
  }

  /** Both files loaded: the credential must belong to the key's identifier. */
  function settle() {
    if (key.value && credential.value && credential.value.subjectAid !== key.value.aid) {
      fail(new KeriLoginError("credential_mismatch"));
      return;
    }
    status.value = key.value ? "ready" : "idle";
  }

  async function loadFile(file: Pick<File, "name" | "size" | "arrayBuffer">) {
    if (status.value === "verifying") return;
    key.value = null;
    errorCode.value = null;
    errorDetail.value = null;
    currentStep.value = null;
    status.value = "loading_file";
    try {
      const contents = await readKeyFileText(file);
      key.value = await client.parseKeyFile(file.name, contents);
      settle();
    } catch (error) {
      fail(error);
    }
  }

  async function loadCredentialFile(file: Pick<File, "name" | "size" | "arrayBuffer">) {
    const parse = client.parseCredentialFile;
    if (status.value === "verifying" || !parse) return;
    credential.value = null;
    errorCode.value = null;
    errorDetail.value = null;
    currentStep.value = null;
    status.value = "loading_file";
    try {
      // Same size/text checks as a key file; any problem means "not a credential".
      const contents = await readKeyFileText(file, KERI_CREDENTIAL_FILE_MAX_BYTES).catch(() => {
        throw new KeriLoginError("invalid_credential_file");
      });
      credential.value = await parse(file.name, contents);
      settle();
    } catch (error) {
      fail(error);
    }
  }

  /** Runs the challenge–response sign-in. Resolves the profile, or `null` on failure. */
  async function signIn(): Promise<KeriSignInProfile | null> {
    const loaded = key.value;
    if (!loaded || status.value === "verifying" || status.value === "loading_file") {
      return null;
    }
    if (needsCredential && !credential.value) return null;
    errorCode.value = null;
    errorDetail.value = null;
    status.value = "verifying";
    try {
      currentStep.value = "challenge";
      const challenge = await client.requestChallenge(loaded.aid);
      currentStep.value = "sign";
      const signature = await client.sign(loaded, challenge);
      currentStep.value = "verify";
      const profile = await client.verify(loaded.aid, challenge, signature, credential.value);
      currentStep.value = "session";
      return profile;
    } catch (error) {
      fail(error);
      return null;
    }
  }

  function stepState(step: KeriLoginStep): KeriStepState {
    const active = currentStep.value;
    if (!active) return "pending";
    const index = KERI_LOGIN_STEPS.indexOf(step);
    const activeIndex = KERI_LOGIN_STEPS.indexOf(active);
    if (index < activeIndex) return "done";
    return index === activeIndex ? "active" : "pending";
  }

  /** Forget the loaded key and return to the empty state. */
  function reset() {
    key.value = null;
    credential.value = null;
    errorCode.value = null;
    errorDetail.value = null;
    currentStep.value = null;
    status.value = "idle";
  }

  /** Forget only the credential file. */
  function removeCredential() {
    credential.value = null;
    errorCode.value = null;
    errorDetail.value = null;
    status.value = key.value ? "ready" : "idle";
  }

  return {
    status,
    key,
    credential,
    needsCredential,
    loadCredentialFile,
    removeCredential,
    currentStep,
    errorCode,
    errorDetail,
    canSubmit,
    canRetry,
    loadFile,
    signIn,
    stepState,
    removeKey: reset,
    reset,
  };
}
