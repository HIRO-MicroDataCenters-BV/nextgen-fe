import { describe, expect, it, vi } from "vitest";
import {
  addIssuedEntry,
  entriesForIssuer,
  summarizeIssued,
  toIssuedEntry,
  type IssuedEntry,
} from "~/composables/issuer/issuedHistory";
import { checkWitness } from "~/composables/issuer/witnessClient";
import type { IssueCredentialResponse } from "~/types/issuer.types";

const ISSUER = "EHnYLZTcuf7RwNe0irrMcbP08-mabVFAYWXo1N9ye62h";
const OTHER_ISSUER = "EOtherIssuerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
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
  issuerAid: ISSUER,
  subjectAid: HOLDER,
  role: "data-provider",
  institute: "HIRO",
  name: "Rahul Sharma",
  email: "rahul@example.org",
  issuedAt: "2026-10-15T09:00:00+00:00",
  grant: {} as IssuedEntry["grant"],
  ...overrides,
});

describe("issued history", () => {
  it("maps an issuer response to an entry", () => {
    const issued = {
      said: "ESAID",
      issuer_aid: ISSUER,
      subject_aid: HOLDER,
      grant: {
        acdc: {
          a: {
            dt: "2026-10-15T10:00:00+00:00",
            role: "catalog_owner",
            institute: "UVA",
            name: "Ada",
            email: "ada@uva.nl",
          },
        },
      },
    } as unknown as IssueCredentialResponse;

    expect(toIssuedEntry(issued)).toMatchObject({
      said: "ESAID",
      issuerAid: ISSUER,
      subjectAid: HOLDER,
      role: "catalog_owner",
      institute: "UVA",
      name: "Ada",
      email: "ada@uva.nl",
      issuedAt: "2026-10-15T10:00:00+00:00",
    });
  });

  it("reads the institute of a credential issued before the rename", () => {
    const issued = {
      said: "EOLD",
      issuer_aid: ISSUER,
      subject_aid: HOLDER,
      grant: { acdc: { a: { dt: "2026-10-15T10:00:00+00:00", role: "operator", org: "HIRO" } } },
    } as unknown as IssueCredentialResponse;

    expect(toIssuedEntry(issued)).toMatchObject({ institute: "HIRO", name: "", email: "" });
  });

  it("adds newest first without duplicates and keeps the limit", () => {
    let history: IssuedEntry[] = [];
    history = addIssuedEntry(history, entry("E1"));
    history = addIssuedEntry(history, entry("E2"));
    history = addIssuedEntry(history, entry("E1"));
    expect(history.map((item) => item.said)).toEqual(["E1", "E2"]);

    expect(addIssuedEntry(history, entry("E3"), 2).map((i) => i.said)).toEqual([
      "E3",
      "E1",
    ]);
  });

  it("keeps each issuer's records apart", () => {
    const history = [entry("E1"), entry("E2", { issuerAid: OTHER_ISSUER })];
    expect(entriesForIssuer(history, ISSUER).map((i) => i.said)).toEqual(["E1"]);
  });

  it("summarizes totals, today and distinct holders", () => {
    const history = [
      entry("E1"),
      entry("E2", { subjectAid: "EOtherHolder" }),
      entry("E3", { issuedAt: "2026-10-14T09:00:00+00:00" }),
    ];
    expect(summarizeIssued(history, new Date("2026-10-15T12:00:00Z"))).toEqual({
      total: 3,
      today: 2,
      holders: 2,
    });
  });
});
