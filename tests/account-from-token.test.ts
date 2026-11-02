import { describe, expect, it } from "vitest";
import { accountFromToken, tokenClaims, tokenExpiry } from "~/composables/useAuthUser";

// A JWT whose payload is UTF-8 JSON, base64url-encoded like ds-login's.
const jwt = (payload: Record<string, unknown>) =>
  `h.${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}.s`;

describe("My account from the ds-login token", () => {
  it("reads the claims ds-login signs", () => {
    const token = jwt({
      sub: "EGzHJPO87Z9GoC3-ohNrIgOuRtCL6kXEq6Nn5TlUXJV-",
      role: "researcher",
      institute: "hus",
      name: "Test Researcher",
      email: "test@hus.fi",
      credential_said: "EG3_o8hEHHk6blJ9Ya9najyiyZvXwLBhIBDzwc30OAg3",
      iat: 1000,
      exp: 1900,
    });
    expect(accountFromToken(token)).toEqual({
      name: "Test Researcher",
      email: "test@hus.fi",
      role: "researcher",
      institute: "hus",
      aid: "EGzHJPO87Z9GoC3-ohNrIgOuRtCL6kXEq6Nn5TlUXJV-",
      credentialSaid: "EG3_o8hEHHk6blJ9Ya9najyiyZvXwLBhIBDzwc30OAg3",
    });
  });

  it("keeps non-ASCII names", () => {
    expect(accountFromToken(jwt({ name: "Päivi Häkkinen" }))?.name).toBe("Päivi Häkkinen");
  });

  it("leaves missing or wrongly typed claims empty", () => {
    const a = accountFromToken(jwt({ sub: 42, role: ["admin"] }));
    expect(a).toMatchObject({ aid: "", role: "", credentialSaid: "" });
  });

  it.each([null, undefined, "", "garbage", "a.b.c"])("no account for %j", (t) => {
    expect(accountFromToken(t)).toBeNull();
    expect(tokenClaims(t)).toBeNull();
  });

  it("expiry still reads through the shared decoder", () => {
    expect(tokenExpiry(jwt({ exp: 1700000900 }))).toBe(1700000900);
  });
});
