import { describe, expect, it } from "vitest";
import {
  buildQueryFromState,
  deriveStateFromQuery,
  sanitizeFilters,
} from "~/composables/useTableQueryState";

describe("useTableQueryState pure helpers", () => {
  it("derives query state with defaults", () => {
    const state = deriveStateFromQuery({});
    expect(state.selectedType).toBe("datasets");
    expect(state.searchValue).toBe("");
    expect(state.currentPage).toBe(0);
  });

  it("sanitizes false/null filters", () => {
    const result = sanitizeFilters(
      { status: true, deleted: false, query: "abc" },
      { page: 2, empty: false },
    );
    expect(result).toEqual({ status: true, query: "abc", page: 2 });
  });

  it("keeps query build/derive idempotent", () => {
    const first = buildQueryFromState({
      selectedType: "applications",
      searchValue: "abc",
      selectedFilterColumn: "name",
      currentPage: 2,
      selectedFilters: { active: true, removed: false },
      activeFilters: {},
    });
    const second = buildQueryFromState({
      ...deriveStateFromQuery(first),
      activeFilters: {},
    });
    expect(second).toEqual(first);
  });
});
