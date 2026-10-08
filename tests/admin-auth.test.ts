import { describe, expect, it } from "vitest";
import {
  DEV_ACTOR_SOURCE,
  decideAdmin,
  parseAdminAids,
  parseAdminEmails,
} from "~/server/utils/adminAuth";

// The Clearing House refuses any `actor` not matching this — see
// UpdateStatusRequest in ds-contract-engine/server/clearing-house. Repeated
// here so the two services cannot drift apart without a test failing.
const CLEARING_HOUSE_ACTOR_FORMAT = /^[a-z0-9][a-z0-9-]*:\S+$/;

const dev = {
  allowlist: ["admin@example.org"],
  production: false,
  allowDevAuthInProduction: false,
};

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    expect(parseAdminEmails(" Admin@Example.org, ,ops@example.org ,")).toEqual([
      "admin@example.org",
      "ops@example.org",
    ]);
  });

  it("treats unset or empty as no admins at all", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("decideAdmin", () => {
  it("lets an allowlisted admin in and says who they are", () => {
    expect(decideAdmin({ ...dev, email: "admin@example.org" })).toEqual({
      ok: true,
      identity: {
        email: "admin@example.org",
        actor: "dev-allowlist:admin@example.org",
      },
    });
  });

  it("matches emails case-insensitively, and records them lowercased", () => {
    const decision = decideAdmin({ ...dev, email: "  ADMIN@Example.org " });
    expect(decision.ok && decision.identity.email).toBe("admin@example.org");
  });

  it("is 401 when no email is sent", () => {
    for (const email of [undefined, "", "   "]) {
      expect(decideAdmin({ ...dev, email })).toMatchObject({
        ok: false,
        statusCode: 401,
      });
    }
  });

  it("is 403 for an email that is not on the list", () => {
    expect(decideAdmin({ ...dev, email: "intern@example.org" })).toMatchObject({
      ok: false,
      statusCode: 403,
      message: "Not an admin",
    });
  });

  it("is 403 with a setup hint when no admins are configured", () => {
    const decision = decideAdmin({
      ...dev,
      allowlist: [],
      email: "admin@example.org",
    });
    expect(decision).toMatchObject({ ok: false, statusCode: 403 });
    expect(!decision.ok && decision.message).toContain("NUXT_ADMIN_EMAILS");
  });

  it("refuses a production build, even for an admin", () => {
    // Fail closed: a production build must not quietly run on a login that
    // checks nothing.
    expect(
      decideAdmin({ ...dev, production: true, email: "admin@example.org" }),
    ).toMatchObject({ ok: false, statusCode: 503 });
  });

  it("allows a production build only when explicitly switched on", () => {
    expect(
      decideAdmin({
        ...dev,
        production: true,
        allowDevAuthInProduction: true,
        email: "admin@example.org",
      }).ok,
    ).toBe(true);
  });

  it("produces an actor the Clearing House will accept", () => {
    const decision = decideAdmin({ ...dev, email: "admin@example.org" });
    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.identity.actor.startsWith(`${DEV_ACTOR_SOURCE}:`)).toBe(true);
    expect(decision.identity.actor).toMatch(CLEARING_HOUSE_ACTOR_FORMAT);
  });
});

describe("admin by key identifier", () => {
  // The mock key login gives every user this same email, so only the key
  // identifier can tell an admin from anyone else.
  const SHARED_EMAIL = "researcher@pathfinder.example";
  const ADMIN_AID = "EAdminKeyIdentifier_xxxxxxxxxxxxxxxxxxxxxxxxx";
  const keyDev = { ...dev, allowlist: [], aidAllowlist: [ADMIN_AID] };

  it("parseAdminAids trims and drops blanks, but keeps case", () => {
    expect(parseAdminAids(" EAbc_-1, ,Exyz ")).toEqual(["EAbc_-1", "Exyz"]);
    expect(parseAdminAids(undefined)).toEqual([]);
  });

  it("lets a listed key in, with the key as the recorded actor", () => {
    const decision = decideAdmin({ ...keyDev, email: SHARED_EMAIL, aid: ADMIN_AID });
    expect(decision).toEqual({
      ok: true,
      identity: {
        email: SHARED_EMAIL,
        aid: ADMIN_AID,
        actor: `${DEV_ACTOR_SOURCE}:${ADMIN_AID}`,
      },
    });
    expect(decision.ok && decision.identity.actor).toMatch(CLEARING_HOUSE_ACTOR_FORMAT);
  });

  it("is 403 for any other key, even with the shared email", () => {
    expect(
      decideAdmin({ ...keyDev, email: SHARED_EMAIL, aid: "EOtherKey" }),
    ).toMatchObject({ ok: false, statusCode: 403, message: "Not an admin" });
  });

  it("matches the identifier exactly: case matters", () => {
    expect(
      decideAdmin({ ...keyDev, email: SHARED_EMAIL, aid: ADMIN_AID.toLowerCase() }).ok,
    ).toBe(false);
  });

  it("still lets an allowlisted email in when the key is not listed", () => {
    expect(
      decideAdmin({
        ...keyDev,
        allowlist: ["admin@example.org"],
        email: "admin@example.org",
        aid: "EOtherKey",
      }).ok,
    ).toBe(true);
  });

  it("is still refused in a production build unless switched on", () => {
    expect(
      decideAdmin({ ...keyDev, production: true, email: SHARED_EMAIL, aid: ADMIN_AID }),
    ).toMatchObject({ ok: false, statusCode: 503 });
  });
});
