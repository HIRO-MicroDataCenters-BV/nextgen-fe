import { describe, expect, it } from "vitest";
import { isTokenValid, tokenExpiry } from "~/composables/useAuthUser";

const jwt = (payload: Record<string, unknown>) =>
  `h.${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.s`;

describe("ds-login token expiry", () => {
  it("reads exp without verifying", () => {
    expect(tokenExpiry(jwt({ exp: 1700000900 }))).toBe(1700000900);
  });

  it.each([null, "", "garbage", "a.b.c", jwt({ sub: "x" })])("no expiry in %j", (t) => {
    expect(tokenExpiry(t)).toBeNull();
    expect(isTokenValid(t)).toBe(false);
  });

  it("valid until exp, not after", () => {
    const t = jwt({ exp: 1000 });
    expect(isTokenValid(t, 999)).toBe(true);
    expect(isTokenValid(t, 1000)).toBe(false);
  });
});
