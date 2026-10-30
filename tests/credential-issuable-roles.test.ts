import { describe, expect, it } from "vitest";
import {
  canIssueCredentials,
  grantClaims,
  issuableRoles,
} from "~/composables/issuer/credentialIssuerClient";
import { issuedAtOf } from "~/composables/issuer/issuedList";

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

  it("a fresh dkms-bin credential gets a date though it has no dt", () => {
    const now = new Date("2026-10-29T09:00:00Z");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(issuedAtOf({ said: "E1", issuer_aid: "EI", subject_aid: "EH", grant: dkms as any }, now)).toBe(now.toISOString());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(issuedAtOf({ said: "E1", issuer_aid: "EI", subject_aid: "EH", grant: keripy as any })).toBe("2026-10-29T08:00:00Z");
  });
});
