import { describe, expect, it } from "vitest";
import { actorFromToken } from "~/composables/admin/useAdminApi";
import { adminFromToken } from "~/composables/admin/useAdminAccess";

// The Clearing House refuses any `actor` not matching this — see
// UpdateStatusRequest in ds-clearing-house. Repeated here so the two
// services cannot drift apart without a test failing.
const CLEARING_HOUSE_ACTOR_FORMAT = /^[a-z0-9][a-z0-9-]*:\S+$/;

const NOW = 1_800_000_000;
const AID = "EJp3cdHEqciR9QUAiJ4VN_kYw9SnvXeADQ-_Xlh8bsMP";

/** A ds-login-shaped JWT. The signature is not checked in the browser. */
function token(claims: Record<string, unknown>): string {
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${b64({ alg: "RS256", kid: "k" })}.${b64(claims)}.sig`;
}

const admin = {
  sub: AID,
  role: "site_admin",
  institute: "hus",
  name: "Site Admin",
  email: "admin@example.org",
  exp: NOW + 900,
};

describe("actorFromToken", () => {
  it("records the signed-in AID as keri:<AID>", () => {
    expect(actorFromToken(token(admin))).toBe(`keri:${AID}`);
    expect(actorFromToken(token(admin))).toMatch(CLEARING_HOUSE_ACTOR_FORMAT);
  });

  it("is null without a usable subject", () => {
    expect(actorFromToken(null)).toBeNull();
    expect(actorFromToken("garbage")).toBeNull();
    expect(actorFromToken(token({ ...admin, sub: "" }))).toBeNull();
    expect(actorFromToken(token({ ...admin, sub: "a b" }))).toBeNull();
  });
});

describe("adminFromToken", () => {
  it("names a signed-in site admin", () => {
    expect(adminFromToken(token(admin), NOW)).toEqual({
      aid: AID,
      name: "Site Admin",
      email: "admin@example.org",
      institute: "hus",
      actor: `keri:${AID}`,
    });
  });

  it("is null for every other role", () => {
    for (const role of ["operator", "data_provider", "researcher", undefined]) {
      expect(adminFromToken(token({ ...admin, role }), NOW), String(role)).toBeNull();
    }
  });

  it("is null once the sign-in has expired, or without one", () => {
    expect(adminFromToken(token({ ...admin, exp: NOW - 1 }), NOW)).toBeNull();
    expect(adminFromToken(null, NOW)).toBeNull();
  });
});
