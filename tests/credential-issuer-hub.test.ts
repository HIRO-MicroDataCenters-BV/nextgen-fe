import { describe, expect, it, vi } from "vitest";
import {
  countByState,
  filterIssued,
  fromSummary,
  issuedAtOf,
  type IssuedEntry,
} from "~/composables/issuer/issuedList";
import { checkWitness } from "~/composables/issuer/witnessClient";
import type { CredentialSummary, IssueCredentialResponse } from "~/types/issuer.types";

const ISSUER = "EHnYLZTcuf7RwNe0irrMcbP08-mabVFAYWXo1N9ye62h";
const HOLDER = "EKt4aUZ2nK2-JXz6o6Oe8k6PvA8Fk-4ZzWbGdL0z6RqA";

const response = (status: number, body = "") =>
  new Response(body, { status });

describe("checkWitness", () => {
  it("finds a published KEL", async () => {
    const fetch = vi.fn(async (_url: string) =>
      response(200, `{"v":"KERI10JSON","t":"icp","i":"${ISSUER}"}-AAB…`),
    );
    await expect(
      checkWitness({ witnessUrl: "/witness/", aid: ISSUER, fetch }),
    ).resolves.toBe("published");
    expect(fetch.mock.calls[0]?.[0]).toBe(`/witness/oobi/${ISSUER}`);
  });

  it("treats keriox's empty 200 as missing", async () => {
    const fetch = vi.fn(async () => response(200, ""));
    await expect(
      checkWitness({ witnessUrl: "/witness", aid: ISSUER, fetch }),
    ).resolves.toBe("missing");
  });

  it("treats 404 as missing", async () => {
    const fetch = vi.fn(async () => response(404));
    await expect(
      checkWitness({ witnessUrl: "/witness", aid: ISSUER, fetch }),
    ).resolves.toBe("missing");
  });

  it("is unknown when the witness is down or not configured", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(
      checkWitness({ witnessUrl: "/witness", aid: ISSUER, fetch: down }),
    ).resolves.toBe("unknown");
    await expect(
      checkWitness({ witnessUrl: "", aid: ISSUER, fetch: down }),
    ).resolves.toBe("unknown");
    expect(down).toHaveBeenCalledTimes(1);
  });
});

const entry = (said: string, overrides: Partial<IssuedEntry> = {}): IssuedEntry => ({
  said,
  subjectAid: HOLDER,
  role: "researcher",
  institute: "hus",
  name: "Rahul Sharma",
  email: "rahul@example.org",
  issuedAt: "2026-10-30T09:00:00+00:00",
  issuedBy: "EAdmin",
  state: "valid",
  revokedAt: null,
  revokedBy: null,
  revokeReason: null,
  hasGrant: true,
  ...overrides,
});

describe("issued list from the issuer", () => {
  it("maps the issuer's summary", () => {
    const summary: CredentialSummary = {
      said: "ESAID",
      subject_aid: HOLDER,
      role: "operator",
      institute: "hus",
      name: "Ollie",
      email: "ollie@hus.nl",
      issued_at: "2026-10-30T09:00:00+00:00",
      issued_by: "bootstrap",
      status: "revoked",
      revoked_at: "2026-10-30T10:00:00+00:00",
      revoked_by: "EAdmin",
      revoke_reason: "left",
      has_grant: false,
    };
    expect(fromSummary(summary)).toEqual({
      said: "ESAID",
      subjectAid: HOLDER,
      role: "operator",
      institute: "hus",
      name: "Ollie",
      email: "ollie@hus.nl",
      issuedAt: "2026-10-30T09:00:00+00:00",
      issuedBy: "bootstrap",
      state: "revoked",
      revokedAt: "2026-10-30T10:00:00+00:00",
      revokedBy: "EAdmin",
      revokeReason: "left",
      hasGrant: false,
    });
  });

  it("dates a fresh credential by its dt, or now when it has none", () => {
    const withDt = {
      said: "E1",
      issuer_aid: ISSUER,
      subject_aid: HOLDER,
      grant: { acdc: { a: { dt: "2026-10-15T10:00:00+00:00", role: "researcher" } } },
    } as unknown as IssueCredentialResponse;
    expect(issuedAtOf(withDt)).toBe("2026-10-15T10:00:00+00:00");
    const now = new Date("2026-10-30T09:00:00Z");
    const without = { ...withDt, grant: { acdc: { a: { a: { role: "researcher" } } } } } as unknown as IssueCredentialResponse;
    expect(issuedAtOf(without, now)).toBe(now.toISOString());
  });
});

describe("issued list filter", () => {
  const entries = [
    entry("EVALID", { name: "Riley", role: "researcher" }),
    entry("EREVOKED", { name: "Dana", role: "data_provider", state: "revoked" }),
    entry("EOTHER", { name: "Ollie", role: "operator" }),
  ];

  it("filters by status, then by search text", () => {
    expect(filterIssued(entries, "all", "").map((e) => e.said)).toEqual(["EVALID", "EREVOKED", "EOTHER"]);
    expect(filterIssued(entries, "valid", "").map((e) => e.said)).toEqual(["EVALID", "EOTHER"]);
    expect(filterIssued(entries, "revoked", "").map((e) => e.said)).toEqual(["EREVOKED"]);
    expect(filterIssued(entries, "all", "  oll ").map((e) => e.said)).toEqual(["EOTHER"]);
    expect(filterIssued(entries, "revoked", "riley")).toEqual([]);
  });

  it("counts each status", () => {
    expect(countByState(entries)).toEqual({ all: 3, valid: 2, revoked: 1 });
  });
});
