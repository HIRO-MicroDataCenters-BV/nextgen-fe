import { describe, expect, it } from "vitest";
import { humanizeRole, isValidRoleName } from "~/composables/issuer/format";

describe("isValidRoleName", () => {
  it.each([
    ["data_steward", true],
    ["catalog_owner", true],
    ["data-provider", true],
    ["ab", true],
    ["a", false],
    ["Data_steward", false],
    ["1role", false],
    ["data steward", false],
    ["data.steward", false],
    ["", false],
    [`a${"b".repeat(63)}`, true],
    [`a${"b".repeat(64)}`, false],
  ])("%s → %s", (role, expected) => {
    expect(isValidRoleName(role)).toBe(expected);
  });
});

describe("humanizeRole", () => {
  it.each([
    ["data_steward", "Data steward"],
    ["data-provider", "Data provider"],
    ["catalog__owner", "Catalog owner"],
    ["researcher", "Researcher"],
  ])("%s → %s", (role, expected) => {
    expect(humanizeRole(role)).toBe(expected);
  });
});
