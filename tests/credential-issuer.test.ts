import { describe, expect, it, vi } from "vitest";
import {
  CredentialIssuerError,
  createCredentialIssuerClient,
  isCesrIdentifier,
  readIssuerError,
} from "~/composables/issuer/credentialIssuerClient";

const ISSUER_AID = "EHnYLZTcuf7RwNe0irrMcbP08-mabVFAYWXo1N9ye62h";
const SUBJECT_AID = "EKt4aUZ2nK2-JXz6o6Oe8k6PvA8Fk-4ZzWbGdL0z6RqA";
const SCHEMA_SAID = "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("isCesrIdentifier", () => {
  it.each([
    [ISSUER_AID, true],
    [`  ${SUBJECT_AID}  `, true],
    ["BCnpU5v4WWrJEFIJUVARekh_STQWK-itNv59Z_Yi7orS", true],
    ["", false],
    ["EHnYLZTcuf7RwNe0irrMcbP08", false],
    ["EHnYLZTcuf7RwNe0irrMcbP08+mabVFAYWXo1N9ye62h", false],
  ])("%s → %s", (value, expected) => {
    expect(isCesrIdentifier(value)).toBe(expected);
  });
});

describe("readIssuerError", () => {
  it("reads a plain detail string", () => {
    expect(readIssuerError({ detail: "KERIpy refused" }, "x")).toBe(
      "KERIpy refused",
    );
  });

  it("names the fields of a FastAPI validation error", () => {
    const body = {
      detail: [
        { loc: ["body", "subject_aid"], msg: "Field required" },
        { loc: ["body", "attributes"], msg: "Field required" },
      ],
    };
    expect(readIssuerError(body, "x")).toBe(
      "subject_aid: Field required; attributes: Field required",
    );
  });

  it("falls back when the body is not JSON", () => {
    expect(readIssuerError(null, "fallback")).toBe("fallback");
  });
});

describe("createCredentialIssuerClient", () => {
  it("reads the issuer from /health-check/", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(200, {
        status: "ok",
        issuer_aid: ISSUER_AID,
        issuer_name: "local-issuer",
      }),
    );
    const client = createCredentialIssuerClient({ baseUrl: "/issuer/", fetch });

    const info = await client.getIssuerInfo();

    expect(fetch).toHaveBeenCalledWith(
      "/issuer/health-check/",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(info.issuer_aid).toBe(ISSUER_AID);
  });

  it("POSTs the credential request and returns the grant", async () => {
    const response = {
      said: "ECsb_U1eT2pCZYcMMxtsydsqXCHtkEzzab6Hhut6JnxT",
      issuer_aid: ISSUER_AID,
      subject_aid: SUBJECT_AID,
      grant: { acdc: {}, iss_sig: "0BB…", iss_oobis: {} },
    };
    const fetch = vi.fn(async () => jsonResponse(200, response));
    const client = createCredentialIssuerClient({ baseUrl: "/issuer", fetch });

    const result = await client.issueCredential({
      subject_aid: SUBJECT_AID,
      schema_said: SCHEMA_SAID,
      attributes: { role: "data-provider", org: "HIRO" },
    });

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/issuer/credentials");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual({
      subject_aid: SUBJECT_AID,
      schema_said: SCHEMA_SAID,
      attributes: { role: "data-provider", org: "HIRO" },
    });
    expect(result).toEqual(response);
  });

  it("turns an error answer into a CredentialIssuerError with the status", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(400, { detail: "KERIpy refused to mint credential: boom" }),
    );
    const client = createCredentialIssuerClient({ baseUrl: "/issuer", fetch });

    const error = await client
      .issueCredential({
        subject_aid: SUBJECT_AID,
        schema_said: SCHEMA_SAID,
        attributes: {},
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CredentialIssuerError);
    expect((error as CredentialIssuerError).status).toBe(400);
    expect((error as CredentialIssuerError).message).toContain("boom");
  });

  it("reports an unreachable issuer", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const client = createCredentialIssuerClient({ baseUrl: "/issuer", fetch });

    await expect(client.getIssuerInfo()).rejects.toThrow(
      "Credential issuer is not reachable.",
    );
  });

  it("gives up when the issuer does not answer in time", async () => {
    // An issuer that never answers: no response until aborted.
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );
    const client = createCredentialIssuerClient({
      baseUrl: "/issuer",
      fetch,
      timeoutMs: 20,
    });

    await expect(client.getIssuerInfo()).rejects.toThrow(
      "Credential issuer is not reachable.",
    );
  });

  it("refuses to call anything when no URL is configured", async () => {
    const fetch = vi.fn();
    const client = createCredentialIssuerClient({ baseUrl: "", fetch });

    await expect(client.getIssuerInfo()).rejects.toThrow(/not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("revocation", () => {
  const SAID = "ECsb_U1eT2pCZYcMMxtsydsqXCHtkEzzab6Hhut6JnxT";

  it("asks the public status endpoint", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(200, { said: SAID, status: "not_revoked", revoked_at: null }),
    );
    const client = createCredentialIssuerClient({ baseUrl: "https://issuer.example/", fetch });

    await expect(client.getCredentialStatus(SAID)).resolves.toMatchObject({
      status: "not_revoked",
    });
    const [url] = fetch.mock.calls[0] as unknown as [string];
    expect(url).toBe(`https://issuer.example/credential-status?said=${SAID}`);
  });

  it("POSTs the reason with the session token", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(200, { said: SAID, status: "revoked", already_revoked: false }),
    );
    const client = createCredentialIssuerClient({
      baseUrl: "/issuer",
      getToken: () => "jwt",
      fetch,
    });

    await client.revokeCredential(SAID, "Left the project");

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/issuer/credentials/${SAID}/revoke`);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer jwt" });
    expect(JSON.parse(init.body as string)).toEqual({ reason: "Left the project" });
  });

  it("shows the issuer's reason when a role may not revoke", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(403, { detail: "role 'operator' may not revoke a site_admin credential" }),
    );
    const client = createCredentialIssuerClient({ baseUrl: "/issuer", fetch });

    const error = await client.revokeCredential(SAID, "").catch((e: unknown) => e);
    expect((error as CredentialIssuerError).status).toBe(403);
    expect((error as CredentialIssuerError).message).toContain("may not revoke");
  });
});

