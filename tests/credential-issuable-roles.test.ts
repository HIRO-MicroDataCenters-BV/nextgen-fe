import { describe, expect, it } from "vitest";
import {
  canIssueCredentials,
  grantClaims,
  issuableRoles,
} from "~/composables/issuer/credentialIssuerClient";
import { toIssuedEntry } from "~/composables/issuer/issuedHistory";

describe("which roles the signed-in user may issue (same rule as the issuer)", () => {
  it.each([
    ["site_admin", ["researcher", "data_provider", "operator", "site_admin"]],
    ["operator", ["researcher", "data_provider"]],
    ["data_provider", []],
    ["researcher", []],
    [null, []],
    ["admin", []],
  ])("%s → %j", (role, expected) => {
    expect(issuableRoles(role)).toEqual(expected);
    expect(canIssueCredentials(role)).toBe(expected.length > 0);
  });
});

describe("credential claims in both ACDC shapes", () => {
  const dkms = { acdc: { d: "E1", a: { d: "EA", a: { i: "EH", role: "researcher", institute: "hus", name: "Riley", email: "r@x" } } } };
  const keripy = { acdc: { d: "E1", a: { i: "EH", role: "operator", institute: "hus", dt: "2026-10-29T08:00:00Z" } } };

  it("reads dkms-bin's acdc.a.a and KERIpy's acdc.a", () => {
    expect(grantClaims(dkms).role).toBe("researcher");
    expect(grantClaims(keripy).role).toBe("operator");
  });

  it("the issued list gets role/name from dkms-bin credentials, and a date though they have no dt", () => {
    const now = new Date("2026-10-29T09:00:00Z");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = toIssuedEntry({ said: "E1", issuer_aid: "EI", subject_aid: "EH", grant: dkms as any }, now);
    expect(entry).toMatchObject({ role: "researcher", institute: "hus", name: "Riley", email: "r@x" });
    expect(entry.issuedAt).toBe(now.toISOString());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(toIssuedEntry({ said: "E1", issuer_aid: "EI", subject_aid: "EH", grant: keripy as any }).issuedAt).toBe("2026-10-29T08:00:00Z");
  });
});
