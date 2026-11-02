import { describe, expect, it } from "vitest";
import { grantFileName } from "~/composables/issuer/format";

const SAID = "EG3_o8hEHHk6blJ9Ya9najyiyZvXwLBhIBDzwc30OAg3";

describe("grant download file name", () => {
  it.each([
    ["hus-researcher2", "hus-researcher2.grant.json"],
    ["HUS Researcher 2", "hus-researcher-2.grant.json"],
    ["Päivi Häkkinen", "paivi-hakkinen.grant.json"],
    ["  Dr. O'Neil / KI  ", "dr-o-neil-ki.grant.json"],
  ])("%j → %s", (name, file) => {
    expect(grantFileName(SAID, name)).toBe(file);
  });

  it.each([undefined, null, "", "   ", "!!!"])("falls back to the SAID for %j", (name) => {
    expect(grantFileName(SAID, name)).toBe(`grant-${SAID}.json`);
  });

  it("keeps long names to 64 characters", () => {
    expect(grantFileName(SAID, "a".repeat(100))).toBe(`${"a".repeat(64)}.grant.json`);
  });
});
