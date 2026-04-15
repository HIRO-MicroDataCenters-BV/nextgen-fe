<script setup lang="ts">
import type {
  ExpandedState,
  Row,
} from "@tanstack/vue-table";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { valueUpdater } from "~/utils";
import type {
  TableColumn,
  TableDataResponse,
  TableRowData,
  TableFilter,
  DropdownMenuItem,
} from "~/types/table.types";
import { useFilters } from "~/composables/useFilters";
import { useTableQueryState } from "~/composables/useTableQueryState";
import { convertJsonLdForTraining } from "~/utils/jsonld";
import { createColumnHeader } from "~/utils/tableHelpers";
import TableToolbar from "@/components/app/table/TableToolbar.vue";
import TableGrid from "@/components/app/table/TableGrid.vue";
import { nextTick } from "vue";

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
  selectionEnabled?: boolean;
  hasSourceHeader?: boolean;
  selectionMode?: "single" | "multiple";
}

const props = withDefaults(defineProps<TableProps>(), {
  title: "",
  columns: () => [],
  pageSize: 10,
  selectionEnabled: true,
  hasSourceHeader: false,
  selectionMode: "multiple",
});

const { dataSource, columns, pageSize, title, hasSourceHeader, selectionMode } =
  props;

const emit = defineEmits<{
  (e: "selection-change", value: Array<string>): void;
  (
    e: "pass-to-training",
    value: { dataset: Array<Record<string, unknown>> },
  ): void;
}>();
const serverData = shallowRef<TableRowData[]>([]); // Raw data from server
const data = shallowRef<TableRowData[]>([]); // Filtered data for display
const rawById = ref<Record<string, unknown>>({});
const isLoading = ref(true);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { page } = useApp();
const {
  filterGroups,
  isLoading: _filtersLoading,
  getActiveFilters,
  resetFilters: _resetFilters,
  fetchFilters,
  syncSelectedFilters,
} = useFilters();
const {
  clientSearchTerm,
  columnFilters,
  columnVisibility,
  currentPage,
  isUpdatingFromState,
  searchValue,
  selectedFilterColumn,
  selectedFilters,
  selectedType,
  updateURLQuery,
} = useTableQueryState({
  routeQuery: route.query as Record<string, unknown>,
  getActiveFilters: () =>
    getActiveFilters() as Record<string, boolean | string | number>,
  replaceQuery: (query) => router.replace({ query }),
});

const isMyCatalog = computed(() => page.value.section === "my_catalog");

const resetUpdatingFlag = () => {
  isUpdatingFromState.value = false;
};

const handleFilterChange = (
  key: string,
  value: boolean | string | number,
  multiple: boolean,
) => {
  isUpdatingFromState.value = true;
  const safetyTimeout = setTimeout(resetUpdatingFlag, 10000);
  if (!multiple) {
    selectedFilters.value = {};
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key !== key) item.value = null;
      });
    });
  }

  if (value) {
    selectedFilters.value[key] = value;
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key === key) item.value = value;
      });
    });
  } else {
    const { [key]: _, ...rest } = selectedFilters.value;
    selectedFilters.value = rest;
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key === key) item.value = null;
      });
    });
  }

  filterGroups.value = [...filterGroups.value];
  searchValue.value = "";
  clientSearchTerm.value = "";
  applyClientSearch();
  updateURLQuery(true);
  fetchData().finally(() => {
    clearTimeout(safetyTimeout);
    isUpdatingFromState.value = false;
  });
};

const handleRemoveFilter = (key: string) => {
  isUpdatingFromState.value = true;
  const safetyTimeout = setTimeout(resetUpdatingFlag, 10000);
  const { [key]: _, ...rest } = selectedFilters.value;
  selectedFilters.value = rest;
  currentPage.value = 0;
  table.setPageIndex(0);

  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      if (item.key === key) {
        item.value = null;
      }
    });
  });
  filterGroups.value = [...filterGroups.value];

  updateURLQuery(true);
  fetchData().finally(() => {
    clearTimeout(safetyTimeout);
    isUpdatingFromState.value = false;
  });
};

const handleClearAllFilters = () => {
  isUpdatingFromState.value = true;
  const safetyTimeout = setTimeout(resetUpdatingFlag, 10000);
  selectedFilters.value = {};
  searchValue.value = "";
  clientSearchTerm.value = ""; // Clear client search
  selectedFilterColumn.value = "all";
  currentPage.value = 0;
  table.setPageIndex(0);

  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      item.value = null;
    });
  });
  filterGroups.value = [...filterGroups.value];

  applyClientSearch(); // Apply empty search (shows all data)
  updateURLQuery(true);
  fetchData().finally(() => {
    clearTimeout(safetyTimeout);
    isUpdatingFromState.value = false;
  });
};

const fetchData = async () => {
  if (isFetching) {
    pendingFetch = true;
    return;
  }
  isFetching = true;
  pendingFetch = false;
  rowSelection.value = {};
  isLoading.value = true;
  try {
    // Fetch data WITHOUT client search term (only server filters)
    const resp = await dataSource({
      page: table.getState().pagination.pageIndex + 1,
      limit: table.getState().pagination.pageSize,
      type: selectedType.value,
      // Remove client search from server request
      filters: {
        ...selectedFilters.value,
        ...getActiveFilters(),
      },
    });

    // map originals by id if provided
    rawById.value = {};
    const respObj = resp as { originals?: unknown[]; data?: TableRowData[] };
    if (respObj && Array.isArray(respObj.originals)) {
      const originals = respObj.originals as unknown[];
      const prepared = (respObj.data || []) as Array<TableRowData>;
      prepared.forEach((row, idx) => {
        const id = String(row.id);
        rawById.value[id] = originals[idx];
      });
    }

    let filteredData: TableRowData[] = respObj?.data ?? [];

    // Filter by type using dcterms:type (not @type, which is always "dcat:Dataset")
    if (selectedType.value === "datasets") {
      filteredData = filteredData.filter((row: TableRowData) => {
        const datasetType = row.datasetType as string | undefined;
        return (
          !datasetType || datasetType === "http://purl.org/dc/dcmitype/Dataset"
        );
      });
    } else if (selectedType.value === "applications") {
      filteredData = filteredData.filter((row: TableRowData) => {
        const datasetType = row.datasetType as string | undefined;
        return datasetType === "http://purl.org/dc/dcmitype/Software";
      });
    }

    // Attach original JSON-LD to each row for downstream converters
    filteredData = filteredData.map((row: TableRowData) => {
      const id = String(row.id);
      const original = rawById.value[id];
      return {
        ...row,
        _raw: original,
        _rawJson: original !== undefined ? JSON.stringify(original) : undefined,
      } as unknown as TableRowData;
    });

    // Store server data and apply client search
    serverData.value = filteredData;
    applyClientSearch();
  } catch {
    serverData.value = [];
    data.value = [];
  } finally {
    isFetching = false;
    isLoading.value = false;
    if (pendingFetch) {
      pendingFetch = false;
      nextTick(() => fetchData());
    }
  }
};

// Client-side search filter
const applyClientSearch = () => {
  if (!clientSearchTerm.value || !clientSearchTerm.value.trim()) {
    data.value = serverData.value;
    return;
  }

  const searchLower = clientSearchTerm.value.toLowerCase().trim();

  data.value = serverData.value.filter((row: TableRowData) => {
    // Search across all column values
    return Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });
};

const rowSelection = ref<Record<string, boolean>>({});
const expanded = ref<ExpandedState>({});

const getColumns = (cols: TableColumn[] | undefined) => {
  if (!cols) return [];
  return cols.map((item) => ({
    id: item.id,
    accessorKey: item.id,
    header: () =>
      createColumnHeader(t(`column.${item.id}`), item.icon, item.iconOnly),
    cell: item.cell,
  }));
};

const selectedRows = ref<Row<TableRowData>[]>([]);

const mappedColumns = ref(getColumns(columns));
const isSelectionVisible = computed(
  () => props.selectionEnabled && selectedType.value === "datasets",
);
const table = useVueTable({
  data,
  columns: mappedColumns.value,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: (row) => String((row as TableRowData).id),
  enableRowSelection: true,
  enableMultiRowSelection: props.selectionMode === "multiple",
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  manualPagination: true,
  globalFilterFn: (row, columnId) => {
    const searchFilter = columnFilters.value.find(
      (filter) => filter.id === "search",
    ) as TableFilter | undefined;
    if (!searchFilter) return true;
    if (searchFilter.column !== "all" && searchFilter.column !== columnId) {
      return true;
    }
    const value = row.getValue(columnId);
    const valueStr = String(value).toLowerCase();
    return valueStr.includes(String(searchFilter.value).toLowerCase());
  },
  initialState: {
    pagination: {
      pageIndex: currentPage.value,
      pageSize: pageSize,
    },
  },
  onPaginationChange: (updater) => {
    const newPagination =
      typeof updater === "function"
        ? updater(table.getState().pagination)
        : updater;
    currentPage.value = newPagination.pageIndex;
    updateURLQuery();
    fetchData();
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return {
        pageIndex: currentPage.value,
        pageSize: pageSize,
      };
    },
  },
});

let fetchDataTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingFetch = false;

const applySearchFilter = () => {
  // Update client search term and apply filter
  clientSearchTerm.value = searchValue.value;
  applyClientSearch();
  updateURLQuery();
};

const handleSearchUpdate = (value: string) => {
  searchValue.value = value;
};

watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState.value) return;
    isUpdatingFromState.value = true;
    try {
      if (newQuery.type && typeof newQuery.type === "string") {
        selectedType.value = newQuery.type;
      } else {
        selectedType.value = "datasets";
      }

      if (newQuery.search && typeof newQuery.search === "string") {
        searchValue.value = newQuery.search;
        clientSearchTerm.value = newQuery.search; // Sync client search
        selectedFilterColumn.value = (newQuery.searchColumn as string) || "all";
      } else {
        searchValue.value = "";
        clientSearchTerm.value = ""; // Clear client search
        selectedFilterColumn.value = "all";
      }

      if (newQuery.filters && typeof newQuery.filters === "string") {
        try {
          const decoded = decodeURIComponent(newQuery.filters);
          const parsedFilters = JSON.parse(decoded);
          selectedFilters.value = parsedFilters;
          nextTick(() => {
            nextTick(() => {
              syncSelectedFilters(parsedFilters);
            });
          });
        } catch {
          selectedFilters.value = {};
          nextTick(() => {
            nextTick(() => {
              syncSelectedFilters({});
            });
          });
        }
      } else {
        selectedFilters.value = {};
        nextTick(() => {
          nextTick(() => {
            syncSelectedFilters({});
          });
        });
      }

      if (newQuery.filters && typeof newQuery.filters === "string") {
        columnFilters.value = JSON.parse(decodeURIComponent(newQuery.filters));
        const currentColumnFilters = columnFilters.value;
        if (currentColumnFilters.length > 0) {
          const searchFilter = currentColumnFilters.find(
            (filter) => filter.id === "search",
          ) as TableFilter | undefined;
          if (searchFilter) {
            searchValue.value = searchFilter.value as string;
            selectedFilterColumn.value = searchFilter.column || "all";
          }
        }
      } else {
        columnFilters.value = [];
      }

      if (newQuery.visibility && typeof newQuery.visibility === "string") {
        columnVisibility.value = JSON.parse(
          decodeURIComponent(newQuery.visibility),
        );
      } else {
        columnVisibility.value = {};
      }
      if (newQuery.page && typeof newQuery.page === "string") {
        const pageIndex = parseInt(newQuery.page);
        currentPage.value = pageIndex;
        table.setPageIndex(pageIndex);
      } else {
        currentPage.value = 0;
        table.setPageIndex(0);
      }
    } finally {
      if (fetchDataTimeout) clearTimeout(fetchDataTimeout);
      fetchDataTimeout = setTimeout(() => {
        fetchDataTimeout = null;
        isUpdatingFromState.value = false;
        fetchData();
      }, 50);
    }
  },
  { deep: true, immediate: true },
);

watch(
  filterGroups,
  (groups) => {
    if (isUpdatingFromState.value) return;
    if (groups.length > 0 && Object.keys(selectedFilters.value).length > 0) {
      isUpdatingFromState.value = true;
      syncSelectedFilters(selectedFilters.value);
      nextTick(() => {
        isUpdatingFromState.value = false;
      });
    }
  },
  { deep: true },
);

watch(
  () => pageSize,
  (newPageSize) => {
    table.setPageSize(newPageSize);
    currentPage.value = 0;
    updateURLQuery();
    fetchData();
  },
);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchValue, () => {
  if (!isUpdatingFromState.value) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      clientSearchTerm.value = searchValue.value;
      applyClientSearch();
      updateURLQuery();
    }, 300);
  }
});

// Watch client search term changes
watch(clientSearchTerm, () => {
  if (!isUpdatingFromState.value) {
    applyClientSearch();
  }
});

watch([selectedFilterColumn, selectedType], () => {
  if (!isUpdatingFromState.value) {
    updateURLQuery();
  }
});

watch(
  selectedFilters,
  () => {
    if (isUpdatingFromState.value) return;
    updateURLQuery();
  },
  { deep: true },
);

onMounted(() => {
  fetchFilters();
  nextTick(() => {
    nextTick(() => {
      if (
        selectedFilters.value &&
        Object.keys(selectedFilters.value).length > 0
      ) {
        syncSelectedFilters(selectedFilters.value);
      } else if (
        route.query.filters &&
        typeof route.query.filters === "string"
      ) {
        try {
          const decoded = decodeURIComponent(route.query.filters);
          const parsed = JSON.parse(decoded);
          selectedFilters.value = parsed;
          syncSelectedFilters(parsed);
        } catch {
          // Error parsing filters
        }
      }
    });
  });

  if (!route.query.type && !route.query.search && !route.query.filters) {
    updateURLQuery(true);
  }
});

watch(
  rowSelection,
  () => {
    const ids = table
      .getSelectedRowModel()
      .rows.map((r) => String((r.original as TableRowData).id));
    selectedRows.value = table.getSelectedRowModel().rows;
    emit("selection-change", ids);
  },
  { deep: true },
);

const filterItems = computed<DropdownMenuItem[]>(() =>
  filterGroups.value.map((group) => ({
    key: group.key,
    label: group.label,
    children: group.items.map((item) => ({
      key: item.key,
      type: item.type,
      value: item.key,
      label: item.label,
    })),
  })),
);

const filterLabelByKey = computed(() => {
  const map: Record<string, string> = {};
  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      map[item.key] = item.label;
    });
  });
  return map;
});

// Compute selected filter keys (UI state takes priority over URL state)
const selectedFilterKeys = computed(() => {
  const keys: string[] = [];

  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      if (
        item.value !== null &&
        item.value !== false &&
        !keys.includes(item.key)
      ) {
        keys.push(item.key);
      }
    });
  });

  Object.keys(selectedFilters.value).forEach((key) => {
    if (
      selectedFilters.value[key] !== false &&
      selectedFilters.value[key] !== null &&
      !keys.includes(key)
    ) {
      keys.push(key);
    }
  });

  return keys;
});

const handleTypeTabChange = (type: string | number) => {
  selectedType.value = String(type);
  updateURLQuery();
  fetchData();
};

const handlePassToTraining = () => {
  const raws = selectedRows.value
    .map((r) => (r.original as unknown as { _rawJson?: string })._rawJson)
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => {
      try {
        return JSON.parse(s) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((o): o is Record<string, unknown> => !!o);

  const looksJsonLdDataset =
    raws.length > 0 &&
    (() => {
      const firstRaw = raws[0];
      if (!firstRaw) return false;
      return (
        (typeof firstRaw["@type"] === "string" &&
          String(firstRaw["@type"]).includes("dcat:Dataset")) ||
        (Array.isArray(firstRaw["@type"]) &&
          (firstRaw["@type"] as unknown[]).some((t) =>
          String(t).includes("dcat:Dataset"),
          ))
      );
    })();

  const inputForConverter = looksJsonLdDataset
    ? ({ "dcat:dataset": raws } as unknown)
    : ({ dataset: raws } as unknown);

  // Convert to simplified format for training
  const payload = convertJsonLdForTraining(inputForConverter);

  // Attach original JSON-LD data to each dataset for Checkout Service
  // This preserves dcat:distribution in JSON-LD format
  if (looksJsonLdDataset && raws.length > 0) {
    payload.dataset = payload.dataset.map(
      (converted: Record<string, unknown>, index: number) => {
        const original = raws[index];
        if (original && typeof original === "object") {
          // Preserve original dcat:distribution if it exists
          if (original["dcat:distribution"]) {
            (converted as Record<string, unknown>)[
              "_original_dcat_distribution"
            ] = original["dcat:distribution"];
          }
          // Preserve original region from catalog if available
          // Region might be in the catalog's dcterms:title
        }
        return converted;
      },
    );
  }

  emit(
    "pass-to-training",
    payload as { dataset: Array<Record<string, unknown>> },
  );
};

const handleClearAll = () => {
  rowSelection.value = {};
};

const handleCreate = () => {
  navigateTo("/my_catalog/create");
};

const getSelectedRaw = () => {
  const ids = table
    .getSelectedRowModel()
    .rows.map((r) => String((r.original as TableRowData).id));
  return ids.map((id) => rawById.value[id]).filter((v) => v !== undefined);
};

defineExpose({ fetchData, getSelectedRaw });
</script>

<template>
  <div class="relative flex min-h-0 w-full flex-1 flex-col">
    <TableToolbar
      :has-source-header="hasSourceHeader"
      :selected-type="selectedType"
      :is-my-catalog="isMyCatalog"
      :search-value="searchValue"
      :filter-items="filterItems"
      :selected-filter-keys="selectedFilterKeys"
      :selected-filters="selectedFilters"
      :filter-label-by-key="filterLabelByKey"
      @create="handleCreate"
      @type-change="handleTypeTabChange"
      @search-update="handleSearchUpdate"
      @apply-search="applySearchFilter"
      @filter-change="handleFilterChange"
      @clear-all-filters="handleClearAllFilters"
      @remove-filter="handleRemoveFilter"
    />
    <AppTablePreloader v-if="isLoading" class="mt-4" />
    <TableGrid
      v-else
      :table="table"
      :is-selection-visible="isSelectionVisible"
      :selection-mode="selectionMode"
      :mapped-columns="mappedColumns"
      :data-source="dataSource"
      :columns="columns"
      :page-size="pageSize"
      :title="title"
    />
    <AppTableRowMenu
      :rows="selectedRows"
      @on-pass-to-training="handlePassToTraining"
      @on-clear-all="handleClearAll"
    />
  </div>
</template>
