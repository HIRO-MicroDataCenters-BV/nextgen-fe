import { describe, expect, it, vi } from "vitest";
import {
  KERI_KEY_FILE_MAX_BYTES,
  KeriLoginError,
  createKeriLoginFlow,
  readKeyFileText,
  type KeriAuthClient,
  type KeriLoginStep,
} from "~/composables/auth/keriLogin";
import {
  createMockKeriAuthClient,
  unavailableKeriAuthClient,
} from "~/composables/auth/keriAuthClient";

const keyFile = (name: string, contents: BlobPart = "key-material") =>
  new File([contents], name);

const profile = { name: "Researcher", email: "researcher@example.org" };

function fakeClient(overrides: Partial<KeriAuthClient> = {}): KeriAuthClient {
  return {
    parseKeyFile: async (fileName) => ({ fileName, aid: "EAID", material: {} }),
    requestChallenge: async () => ({ id: "c1", nonce: "n1" }),
    sign: async () => "sig",
    verify: async () => profile,
    ...overrides,
  };
}

describe("createKeriLoginFlow", () => {
  it("loads a key file locally and becomes ready", async () => {
    const flow = createKeriLoginFlow(fakeClient());
    await flow.loadFile(keyFile("me.key"));

    expect(flow.status.value).toBe("ready");
    expect(flow.key.value?.aid).toBe("EAID");
    expect(flow.canSubmit.value).toBe(true);
  });

  it("never passes key material to the challenge or verify calls", async () => {
    const seen: unknown[] = [];
    const flow = createKeriLoginFlow(
      fakeClient({
        parseKeyFile: async (fileName) => ({
          fileName,
          aid: "EAID",
          material: "SECRET",
        }),
        requestChallenge: async (...args) => {
          seen.push(...args);
          return { id: "c1", nonce: "n1" };
        },
        verify: async (...args) => {
          seen.push(...args);
          return profile;
        },
      }),
    );
    await flow.loadFile(keyFile("me.key"));
    await flow.signIn();

    expect(JSON.stringify(seen)).not.toContain("SECRET");
  });

  it("walks the steps in order and resolves the profile", async () => {
    const steps: (KeriLoginStep | null)[] = [];
    const flow = createKeriLoginFlow(
      fakeClient({
        requestChallenge: async () => {
          steps.push(flow.currentStep.value);
          return { id: "c1", nonce: "n1" };
        },
        sign: async () => {
          steps.push(flow.currentStep.value);
          return "sig";
        },
        verify: async () => {
          steps.push(flow.currentStep.value);
          expect(flow.stepState("challenge")).toBe("done");
          expect(flow.stepState("verify")).toBe("active");
          expect(flow.stepState("session")).toBe("pending");
          return profile;
        },
      }),
    );
    await flow.loadFile(keyFile("me.key"));

    await expect(flow.signIn()).resolves.toEqual(profile);
    expect(steps).toEqual(["challenge", "sign", "verify"]);
    expect(flow.currentStep.value).toBe("session");
  });

  it("does nothing when no key is loaded", async () => {
    const flow = createKeriLoginFlow(fakeClient());
    await expect(flow.signIn()).resolves.toBeNull();
    expect(flow.status.value).toBe("idle");
  });

  it("rejects an invalid file and asks for another", async () => {
    const flow = createKeriLoginFlow(
      fakeClient({
        parseKeyFile: () => Promise.reject(new KeriLoginError("invalid_key_file")),
      }),
    );
    await flow.loadFile(keyFile("notes.txt"));

    expect(flow.status.value).toBe("error");
    expect(flow.errorCode.value).toBe("invalid_key_file");
    expect(flow.key.value).toBeNull();
    expect(flow.canRetry.value).toBe(false);
  });

  it("clears the key when it has been replaced", async () => {
    const flow = createKeriLoginFlow(
      fakeClient({
        verify: () => Promise.reject(new KeriLoginError("key_replaced")),
      }),
    );
    await flow.loadFile(keyFile("old.key"));
    await flow.signIn();

    expect(flow.errorCode.value).toBe("key_replaced");
    expect(flow.key.value).toBeNull();
    expect(flow.canRetry.value).toBe(false);
  });

  it("keeps the key and allows retry when witnesses are unavailable", async () => {
    let attempts = 0;
    const flow = createKeriLoginFlow(
      fakeClient({
        verify: async () => {
          attempts += 1;
          if (attempts === 1) throw new KeriLoginError("witnesses_unavailable");
          return profile;
        },
      }),
    );
    await flow.loadFile(keyFile("me.key"));
    await flow.signIn();

    expect(flow.errorCode.value).toBe("witnesses_unavailable");
    expect(flow.key.value).not.toBeNull();
    expect(flow.canRetry.value).toBe(true);

    await expect(flow.signIn()).resolves.toEqual(profile);
    expect(flow.errorCode.value).toBeNull();
  });

  it("maps unexpected errors to unknown and keeps the key", async () => {
    const flow = createKeriLoginFlow(
      fakeClient({ sign: () => Promise.reject(new Error("boom")) }),
    );
    await flow.loadFile(keyFile("me.key"));
    await flow.signIn();

    expect(flow.errorCode.value).toBe("unknown");
    expect(flow.canRetry.value).toBe(true);
  });

  it("reset forgets the loaded key", async () => {
    const flow = createKeriLoginFlow(fakeClient());
    await flow.loadFile(keyFile("me.key"));
    flow.reset();

    expect(flow.key.value).toBeNull();
    expect(flow.status.value).toBe("idle");
  });
});

describe("key file checks", () => {
  it.each([
    ["an empty file", keyFile("empty.key", ""), "empty_key_file"],
    ["a whitespace-only file", keyFile("blank.key", "  \n\t\r\n "), "empty_key_file"],
    [
      "a file over the size limit",
      keyFile("big.key", "a".repeat(KERI_KEY_FILE_MAX_BYTES + 1)),
      "key_file_too_large",
    ],
    [
      "a binary file",
      keyFile("photo.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      "invalid_key_file",
    ],
    ["a file with a NUL byte", keyFile("nul.key", `abc${String.fromCharCode(0)}def`), "invalid_key_file"],
    [
      "invalid UTF-8",
      keyFile("latin1.key", new Uint8Array([0x6b, 0x65, 0x79, 0xff, 0xfe])),
      "invalid_key_file",
    ],
  ])("rejects %s before the client sees it", async (_label, file, code) => {
    const parseKeyFile = vi.fn();
    const flow = createKeriLoginFlow(fakeClient({ parseKeyFile }));
    await flow.loadFile(file);

    expect(flow.errorCode.value).toBe(code);
    expect(flow.key.value).toBeNull();
    expect(flow.canRetry.value).toBe(false);
    expect(parseKeyFile).not.toHaveBeenCalled();
  });

  it("does not read a file that is too large", async () => {
    const arrayBuffer = vi.fn();
    await expect(
      readKeyFileText({ size: KERI_KEY_FILE_MAX_BYTES + 1, arrayBuffer }),
    ).rejects.toMatchObject({ code: "key_file_too_large" });
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("accepts a text file exactly at the size limit", async () => {
    const text = "k".repeat(KERI_KEY_FILE_MAX_BYTES);
    await expect(readKeyFileText(keyFile("max.key", text))).resolves.toBe(text);
  });

  it("accepts multi-line UTF-8 text and drops a leading BOM", async () => {
    const text = '{\n\t"aid": "Eé"\r\n}';
    await expect(readKeyFileText(keyFile("key.json", String.fromCharCode(0xfeff) + text))).resolves.toBe(
      text,
    );
  });
});

describe("keri auth clients", () => {
  it("mock derives a stable identifier-shaped AID from the file", async () => {
    const client = createMockKeriAuthClient(0);
    const a = await client.parseKeyFile("me.key", "same");
    const b = await client.parseKeyFile("again.key", "same");

    expect(a.aid).toMatch(/^E[A-Za-z0-9_-]{43}$/);
    expect(a.aid).toBe(b.aid);
  });

  it.each([
    ["invalid.key", "invalid_key_file"],
    ["replaced.key", "key_replaced"],
    ["offline.key", "witnesses_unavailable"],
  ])("mock file name %s triggers %s", async (fileName, code) => {
    const flow = createKeriLoginFlow(createMockKeriAuthClient(0));
    await flow.loadFile(keyFile(fileName));
    await flow.signIn();

    expect(flow.errorCode.value).toBe(code);
  });

  it("mock signs in any other key file", async () => {
    const flow = createKeriLoginFlow(createMockKeriAuthClient(0));
    await flow.loadFile(keyFile("me.key"));

    await expect(flow.signIn()).resolves.toMatchObject({
      email: expect.stringContaining("@"),
    });
  });

  it("unavailable client reports not_available as soon as a file is chosen", async () => {
    const flow = createKeriLoginFlow(unavailableKeriAuthClient);
    await flow.loadFile(keyFile("me.key"));

    expect(flow.errorCode.value).toBe("not_available");
    expect(flow.key.value).toBeNull();
  });
});
