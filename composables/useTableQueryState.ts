import { computed, ref } from "vue";
import type { ColumnFiltersState, VisibilityState } from "@tanstack/vue-table";

type QueryValue = boolean | string | number;
type QueryFilters = Record<string, QueryValue>;

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

export const useTableQueryState = ({
  routeQuery,
  getActiveFilters,
  replaceQuery,
}: UseTableQueryStateParams) => {
  const selectedFilterColumn = ref(
    (routeQuery.searchColumn as string | undefined) || "all",
  );
  const searchValue = ref((routeQuery.search as string | undefined) || "");
  const clientSearchTerm = ref((routeQuery.search as string | undefined) || "");
  const selectedType = ref((routeQuery.type as string | undefined) || "datasets");
  const selectedFilters = ref<QueryFilters>(parseJsonQuery<QueryFilters>(
    routeQuery.filters,
    {},
  ));
  const currentPage = ref<number>(
    routeQuery.page && typeof routeQuery.page === "string"
      ? parseInt(routeQuery.page)
      : 0,
  );
  const columnFilters = ref<ColumnFiltersState>(
    parseJsonQuery<ColumnFiltersState>(routeQuery.filters, []),
  );
  const columnVisibility = ref<VisibilityState>(
    parseJsonQuery<VisibilityState>(routeQuery.visibility, {}),
  );
  const isUpdatingFromState = ref(false);

  const cleanedFilters = computed<QueryFilters>(() => {
    const activeFilters = {
      ...selectedFilters.value,
      ...getActiveFilters(),
    };
    const cleaned: QueryFilters = {};
    Object.keys(activeFilters).forEach((key) => {
      const value = activeFilters[key];
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
  });

  const updateURLQuery = (force = false) => {
    if (!force && isUpdatingFromState.value) return;

    const query: Record<string, string> = {};

    if (selectedType.value && selectedType.value !== "datasets") {
      query.type = selectedType.value;
    }

    if (searchValue.value && searchValue.value.trim()) {
      query.search = searchValue.value;
      query.searchColumn = selectedFilterColumn.value;
    }

    if (Object.keys(cleanedFilters.value).length > 0) {
      query.filters = encodeURIComponent(JSON.stringify(cleanedFilters.value));
    }

    if (currentPage.value > 0) {
      query.page = String(currentPage.value);
    }

    replaceQuery(query);
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
