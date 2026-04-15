import { ref } from "vue";
import type { ColumnFiltersState, VisibilityState } from "@tanstack/vue-table";

type QueryValue = boolean | string | number;
type QueryFilters = Record<string, QueryValue>;

export interface TableQueryStateSnapshot {
  selectedFilterColumn: string;
  searchValue: string;
  clientSearchTerm: string;
  selectedType: string;
  selectedFilters: QueryFilters;
  currentPage: number;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
}

interface UseTableQueryStateParams {
  routeQuery: Record<string, unknown>;
  getActiveFilters: () => Record<string, QueryValue>;
  replaceQuery: (query: Record<string, string>) => void;
}

const parseJsonQuery = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
};

export const deriveStateFromQuery = (
  routeQuery: Record<string, unknown>,
): TableQueryStateSnapshot => ({
  selectedFilterColumn:
    (routeQuery.searchColumn as string | undefined) || "all",
  searchValue: (routeQuery.search as string | undefined) || "",
  clientSearchTerm: (routeQuery.search as string | undefined) || "",
  selectedType: (routeQuery.type as string | undefined) || "datasets",
  selectedFilters: parseJsonQuery<QueryFilters>(routeQuery.filters, {}),
  currentPage:
    routeQuery.page && typeof routeQuery.page === "string"
      ? parseInt(routeQuery.page)
      : 0,
  columnFilters: parseJsonQuery<ColumnFiltersState>(routeQuery.filters, []),
  columnVisibility: parseJsonQuery<VisibilityState>(routeQuery.visibility, {}),
});

export const sanitizeFilters = (
  selectedFilters: QueryFilters,
  activeFilters: Record<string, QueryValue>,
): QueryFilters => {
  const combined = { ...selectedFilters, ...activeFilters };
  const cleaned: QueryFilters = {};
  Object.keys(combined).forEach((key) => {
    const value = combined[key];
    if (
      value !== null &&
      value !== undefined &&
      value !== false &&
      typeof value !== "object"
    ) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const buildQueryFromState = (state: {
  selectedType: string;
  searchValue: string;
  selectedFilterColumn: string;
  currentPage: number;
  selectedFilters: QueryFilters;
  activeFilters: Record<string, QueryValue>;
}): Record<string, string> => {
  const query: Record<string, string> = {};
  const cleanedFilters = sanitizeFilters(
    state.selectedFilters,
    state.activeFilters,
  );

  if (state.selectedType && state.selectedType !== "datasets") {
    query.type = state.selectedType;
  }
  if (state.searchValue && state.searchValue.trim()) {
    query.search = state.searchValue;
    query.searchColumn = state.selectedFilterColumn;
  }
  if (Object.keys(cleanedFilters).length > 0) {
    query.filters = encodeURIComponent(JSON.stringify(cleanedFilters));
  }
  if (state.currentPage > 0) {
    query.page = String(state.currentPage);
  }

  return query;
};

export const useTableQueryState = ({
  routeQuery,
  getActiveFilters,
  replaceQuery,
}: UseTableQueryStateParams) => {
  const initialState = deriveStateFromQuery(routeQuery);
  const selectedFilterColumn = ref(initialState.selectedFilterColumn);
  const searchValue = ref(initialState.searchValue);
  const clientSearchTerm = ref(initialState.clientSearchTerm);
  const selectedType = ref(initialState.selectedType);
  const selectedFilters = ref<QueryFilters>(initialState.selectedFilters);
  const currentPage = ref<number>(initialState.currentPage);
  const columnFilters = ref<ColumnFiltersState>(initialState.columnFilters);
  const columnVisibility = ref<VisibilityState>(initialState.columnVisibility);
  const isUpdatingFromState = ref(false);

  const updateURLQuery = (force = false) => {
    if (!force && isUpdatingFromState.value) return;
    replaceQuery(
      buildQueryFromState({
        selectedType: selectedType.value,
        searchValue: searchValue.value,
        selectedFilterColumn: selectedFilterColumn.value,
        currentPage: currentPage.value,
        selectedFilters: selectedFilters.value,
        activeFilters: getActiveFilters() as Record<string, QueryValue>,
      }),
    );
  };

  return {
    clientSearchTerm,
    columnFilters,
    columnVisibility,
    currentPage,
    isUpdatingFromState,
    selectedFilterColumn,
    searchValue,
    selectedFilters,
    selectedType,
    updateURLQuery,
  };
};
