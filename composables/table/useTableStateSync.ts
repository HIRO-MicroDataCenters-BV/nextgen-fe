import { nextTick, onMounted, watch, type Ref } from "vue";

type SelectedFilterValue = boolean | string | number;

interface FilterGroupItem {
  key: string;
  value: SelectedFilterValue | null;
}

interface FilterGroup {
  items: FilterGroupItem[];
}

interface UseTableStateSyncOptions {
  route: { query: Record<string, unknown> };
  filterGroups: Ref<FilterGroup[]>;
  selectedFilters: Ref<Record<string, SelectedFilterValue>>;
  isUpdatingFromState: Ref<boolean>;
  selectedType: Ref<string>;
  searchValue: Ref<string>;
  clientSearchTerm: Ref<string>;
  selectedFilterColumn: Ref<string>;
  columnFilters: Ref<Array<{ id: string; value: unknown; column?: string }>>;
  columnVisibility: Ref<Record<string, boolean>>;
  currentPage: Ref<number>;
  updateURLQuery: (replace?: boolean) => void;
  applyClientSearch: () => void;
  fetchData: () => Promise<void>;
  fetchFilters: () => void;
  syncSelectedFilters: (filters: Record<string, SelectedFilterValue>) => void;
  setPageIndex: (value: number) => void;
}

export const useTableStateSync = (options: UseTableStateSyncOptions) => {
  let fetchDataTimeout: ReturnType<typeof setTimeout> | null = null;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  watch(
    () => options.route.query,
    (newQuery) => {
      if (options.isUpdatingFromState.value) return;
      options.isUpdatingFromState.value = true;
      try {
        if (newQuery.type && typeof newQuery.type === "string") {
          options.selectedType.value = newQuery.type;
        } else {
          options.selectedType.value = "datasets";
        }

        if (newQuery.search && typeof newQuery.search === "string") {
          options.searchValue.value = newQuery.search;
          options.clientSearchTerm.value = newQuery.search;
          options.selectedFilterColumn.value =
            (newQuery.searchColumn as string) || "all";
        } else {
          options.searchValue.value = "";
          options.clientSearchTerm.value = "";
          options.selectedFilterColumn.value = "all";
        }

        if (newQuery.filters && typeof newQuery.filters === "string") {
          try {
            const parsedFilters = JSON.parse(decodeURIComponent(newQuery.filters));
            options.selectedFilters.value = parsedFilters;
            nextTick(() => {
              nextTick(() => {
                options.syncSelectedFilters(parsedFilters);
              });
            });
          } catch {
            options.selectedFilters.value = {};
            nextTick(() => {
              nextTick(() => {
                options.syncSelectedFilters({});
              });
            });
          }
        } else {
          options.selectedFilters.value = {};
          nextTick(() => {
            nextTick(() => {
              options.syncSelectedFilters({});
            });
          });
        }

        if (newQuery.filters && typeof newQuery.filters === "string") {
          options.columnFilters.value = JSON.parse(
            decodeURIComponent(newQuery.filters),
          );
          const searchFilter = options.columnFilters.value.find(
            (filter) => filter.id === "search",
          );
          if (searchFilter) {
            options.searchValue.value = searchFilter.value as string;
            options.selectedFilterColumn.value = searchFilter.column || "all";
          }
        } else {
          options.columnFilters.value = [];
        }

        if (newQuery.visibility && typeof newQuery.visibility === "string") {
          options.columnVisibility.value = JSON.parse(
            decodeURIComponent(newQuery.visibility),
          );
        } else {
          options.columnVisibility.value = {};
        }

        if (newQuery.page && typeof newQuery.page === "string") {
          const pageIndex = parseInt(newQuery.page);
          options.currentPage.value = pageIndex;
          options.setPageIndex(pageIndex);
        } else {
          options.currentPage.value = 0;
          options.setPageIndex(0);
        }
      } finally {
        if (fetchDataTimeout) clearTimeout(fetchDataTimeout);
        fetchDataTimeout = setTimeout(() => {
          fetchDataTimeout = null;
          options.isUpdatingFromState.value = false;
          options.fetchData();
        }, 50);
      }
    },
    { deep: true, immediate: true },
  );

  watch(
    options.filterGroups,
    (groups) => {
      if (options.isUpdatingFromState.value) return;
      if (groups.length > 0 && Object.keys(options.selectedFilters.value).length > 0) {
        options.isUpdatingFromState.value = true;
        options.syncSelectedFilters(options.selectedFilters.value);
        nextTick(() => {
          options.isUpdatingFromState.value = false;
        });
      }
    },
    { deep: true },
  );

  watch(options.searchValue, () => {
    if (options.isUpdatingFromState.value) return;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      options.clientSearchTerm.value = options.searchValue.value;
      options.applyClientSearch();
      options.updateURLQuery();
    }, 300);
  });

  watch(options.clientSearchTerm, () => {
    if (!options.isUpdatingFromState.value) {
      options.applyClientSearch();
    }
  });

  watch([options.selectedFilterColumn, options.selectedType], () => {
    if (!options.isUpdatingFromState.value) {
      options.updateURLQuery();
    }
  });

  watch(
    options.selectedFilters,
    () => {
      if (!options.isUpdatingFromState.value) {
        options.updateURLQuery();
      }
    },
    { deep: true },
  );

  onMounted(() => {
    options.fetchFilters();
    nextTick(() => {
      nextTick(() => {
        if (Object.keys(options.selectedFilters.value).length > 0) {
          options.syncSelectedFilters(options.selectedFilters.value);
        } else if (
          options.route.query.filters &&
          typeof options.route.query.filters === "string"
        ) {
          try {
            const parsed = JSON.parse(
              decodeURIComponent(options.route.query.filters),
            );
            options.selectedFilters.value = parsed;
            options.syncSelectedFilters(parsed);
          } catch {
            // ignore malformed filter query payload
          }
        }
      });
    });

    if (
      !options.route.query.type &&
      !options.route.query.search &&
      !options.route.query.filters
    ) {
      options.updateURLQuery(true);
    }
  });
};
