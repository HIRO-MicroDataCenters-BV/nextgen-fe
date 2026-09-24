import { computed, ref, shallowRef } from "vue";

/**
 * KERI identity-key sign-in flow, kept free of Nuxt auto-imports so it can be
 * unit-tested in Node. The component (`AppKeyLoginForm`) owns presentation; this
 * module owns the sequence: read key file locally → request challenge → sign on
 * this device → server verifies against the identifier's current key state.
 *
 * The private key material never leaves the browser: only the identifier (AID)
 * and a signature are sent to the backend.
 */

export type KeriLoginErrorCode =
  | "invalid_key_file"
  | "empty_key_file"
  | "key_file_too_large"
  | "key_replaced"
  | "witnesses_unavailable"
  | "not_available"
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

export interface KeriChallenge {
  id: string;
  nonce: string;
}

/** Profile of the account linked to the identifier, as returned by the backend. */
export interface KeriSignInProfile {
  name: string;
  email: string;
}

/**
 * Seam for the real KERI backend. Implementations must throw `KeriLoginError`
 * for expected failures so the UI can show the matching message.
 */
export interface KeriAuthClient {
  /** Parse a key file locally. Must not send `contents` over the network. */
  parseKeyFile(fileName: string, contents: string): Promise<KeriLoadedKey>;
  requestChallenge(aid: string): Promise<KeriChallenge>;
  /** Sign the challenge on this device with the loaded key. */
  sign(key: KeriLoadedKey, challenge: KeriChallenge): Promise<string>;
  /** Backend checks the signature against the identifier's current key state. */
  verify(
    aid: string,
    challenge: KeriChallenge,
    signature: string,
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
  "unknown",
]);

const toErrorCode = (error: unknown): KeriLoginErrorCode =>
  error instanceof KeriLoginError ? error.code : "unknown";

/** Key files are small; anything bigger is not one and is not worth reading. */
export const KERI_KEY_FILE_MAX_BYTES = 16 * 1024;

/** Control characters a text key file may legitimately contain: tab, LF, CR. */
const ALLOWED_CONTROL_BYTES: ReadonlySet<number> = new Set([0x09, 0x0a, 0x0d]);

/**
 * Format-independent checks, run before any parsing: rejects files that are too
 * large (without reading them), empty or whitespace-only, or not text — binary
 * control bytes or invalid UTF-8. A leading UTF-8 BOM is dropped.
 */
export async function readKeyFileText(
  file: Pick<File, "size" | "arrayBuffer">,
): Promise<string> {
  if (file.size > KERI_KEY_FILE_MAX_BYTES) {
    throw new KeriLoginError("key_file_too_large");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > KERI_KEY_FILE_MAX_BYTES) {
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
  const currentStep = ref<KeriLoginStep | null>(null);
  const errorCode = ref<KeriLoginErrorCode | null>(null);

  const canSubmit = computed(() => status.value === "ready" && !!key.value);
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
    currentStep.value = null;
    // Keep the key only when retrying it makes sense; otherwise ask for a new file.
    if (!RETRYABLE_WITH_KEY.has(code)) key.value = null;
    status.value = "error";
  }

  async function loadFile(file: Pick<File, "name" | "size" | "arrayBuffer">) {
    if (status.value === "verifying") return;
    key.value = null;
    errorCode.value = null;
    currentStep.value = null;
    status.value = "loading_file";
    try {
      const contents = await readKeyFileText(file);
      key.value = await client.parseKeyFile(file.name, contents);
      status.value = "ready";
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
    errorCode.value = null;
    status.value = "verifying";
    try {
      currentStep.value = "challenge";
      const challenge = await client.requestChallenge(loaded.aid);
      currentStep.value = "sign";
      const signature = await client.sign(loaded, challenge);
      currentStep.value = "verify";
      const profile = await client.verify(loaded.aid, challenge, signature);
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
    errorCode.value = null;
    currentStep.value = null;
    status.value = "idle";
  }

  return {
    status,
    key,
    currentStep,
    errorCode,
    canSubmit,
    canRetry,
    loadFile,
    signIn,
    stepState,
    removeKey: reset,
    reset,
  };
}
