<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  Row,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  FlexRender,
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
import { convertJsonLdForTraining } from "~/utils/jsonld";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { nextTick } from "vue";

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
  selectionEnabled?: boolean;
  hasSourceHeader?: boolean;
}

const props = withDefaults(defineProps<TableProps>(), {
  title: "",
  columns: () => [],
  pageSize: 10,
  selectionEnabled: true,
  hasSourceHeader: false,
});

const { dataSource, columns, pageSize, title, hasSourceHeader } = props;

const emit = defineEmits<{
  (e: "selection-change", value: Array<string>): void;
  (
    e: "pass-to-training",
    value: { dataset: Array<Record<string, unknown>> }
  ): void;
}>();
const data = shallowRef<TableRowData[]>([]);
const rawById = ref<Record<string, unknown>>({});
const isLoading = ref(true);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { page } = useApp();
const {
  filterGroups,
  getActiveFilters,
  resetFilters: _resetFilters,
} = useFilters();

// Function to sync selectedFilters with filterGroups
const syncFiltersToUI = (filters: Record<string, boolean | string | number>) => {
  console.log("=== Syncing filters to UI ===");
  console.log("Filters to sync:", filters);
  console.log("FilterGroups before sync:", JSON.parse(JSON.stringify(filterGroups.value)));
  
  // Directly update values in filterGroups to ensure reactivity
  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      const filterValue = filters[item.key];
      
      if (filterValue !== undefined && filterValue !== false && filterValue !== null) {
        if (item.value !== filterValue) {
          item.value = filterValue;
          console.log(`✓ Setting ${item.key} to ${filterValue} (was ${item.value})`);
        }
      } else if (!(item.key in filters)) {
        // Only reset if not in filters
        if (item.value !== null) {
          item.value = null;
          console.log(`✗ Resetting ${item.key} to null`);
        }
      }
    });
  });
  
  // Force reactivity update by reassigning the array
  filterGroups.value = [...filterGroups.value];
  
  console.log("FilterGroups after sync:", JSON.parse(JSON.stringify(filterGroups.value)));
  console.log("=== Sync complete ===");
};

// Initialize from URL query parameters
const selectedFilterColumn = ref(
  (route.query.searchColumn as string) || "all"
);
const searchValue = ref((route.query.search as string) || "");
const selectedType = ref((route.query.type as string) || "datasets");
const selectedFilters = ref<Record<string, boolean | string | number>>(() => {
  try {
    if (route.query.filters && typeof route.query.filters === "string") {
      const decoded = decodeURIComponent(route.query.filters);
      console.log("Initialization - Decoded filters from URL:", decoded);
      const parsed = JSON.parse(decoded);
      console.log("Initialization - Parsed filters:", parsed);
      return parsed;
    }
  } catch (e) {
    console.error("Error parsing filters from URL:", e);
  }
  return {};
});
const isMyCatalog = computed(() => page.value.section === "my_catalog");

// Function to update URL query parameters
const updateURLQuery = () => {
  if (isUpdatingFromState.value) {
    console.log("updateURLQuery blocked by isUpdatingFromState");
    return;
  }
  
  console.log("updateURLQuery called - selectedFilters:", selectedFilters.value, "searchValue:", searchValue.value);
  
  const query: Record<string, string> = {};

  // Update type
  if (selectedType.value && selectedType.value !== "datasets") {
    query.type = selectedType.value;
  }

  // Update search
  if (searchValue.value && searchValue.value.trim()) {
    query.search = searchValue.value;
    query.searchColumn = selectedFilterColumn.value;
  }

  // Update filters - use selectedFilters directly, getActiveFilters() is for reading from UI
  const activeFilters = {
    ...selectedFilters.value,
    ...getActiveFilters(),
  };
  // Remove null/undefined/false values
  const cleanedFilters: Record<string, boolean | string | number> = {};
  Object.keys(activeFilters).forEach((key) => {
    const value = activeFilters[key];
    if (value !== null && value !== undefined && value !== false) {
      cleanedFilters[key] = value;
    }
  });
  
  if (Object.keys(cleanedFilters).length > 0) {
    query.filters = encodeURIComponent(JSON.stringify(cleanedFilters));
  }

  // Update page
  if (currentPage.value > 0) {
    query.page = String(currentPage.value);
  }

  console.log("updateURLQuery - updating query to:", query);
  // Update URL without triggering navigation
  router.replace({ query });
};

const handleFilterChange = (
  key: string,
  value: boolean | string | number,
  multiple: boolean
) => {
  if (!multiple) {
    selectedFilters.value = {};
    // Reset all filter values in UI when switching to single selection mode
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key !== key) {
          item.value = null;
        }
      });
    });
  }

  if (value) {
    selectedFilters.value[key] = value;
    // Sync UI - update filter value in filterGroups
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key === key) {
          item.value = value;
        }
      });
    });
  } else {
    const { [key]: _, ...rest } = selectedFilters.value;
    selectedFilters.value = rest;
    // Sync UI - reset filter value in filterGroups
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.key === key) {
          item.value = null;
        }
      });
    });
  }
  
  // Force reactivity update
  filterGroups.value = [...filterGroups.value];
  
  searchValue.value = "";
  applySearchFilter();
  updateURLQuery();
  fetchData();
};

const handleRemoveFilter = (key: string) => {
  const { [key]: _, ...rest } = selectedFilters.value;
  selectedFilters.value = rest;
  currentPage.value = 0;
  table.setPageIndex(0);
  
  // Sync UI - reset the filter value in filterGroups
  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      if (item.key === key) {
        item.value = null;
      }
    });
  });
  // Force reactivity update
  filterGroups.value = [...filterGroups.value];
  
  updateURLQuery();
  fetchData();
};

const handleClearAllFilters = () => {
  selectedFilters.value = {};
  searchValue.value = "";
  selectedFilterColumn.value = "all";
  currentPage.value = 0;
  table.setPageIndex(0);
  
  // Sync UI - reset all filter values in filterGroups
  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      item.value = null;
    });
  });
  // Force reactivity update
  filterGroups.value = [...filterGroups.value];
  
  applySearchFilter();
  updateURLQuery();
  fetchData();
};

const fetchData = async () => {
  rowSelection.value = {};
  //selectedFilters.value = { "med:age": true };
  isLoading.value = true;
  const resp = await dataSource({
    page: table.getState().pagination.pageIndex + 1,
    limit: table.getState().pagination.pageSize,
    type: selectedType.value,
    ...(searchValue.value &&
      selectedFilterColumn.value && {
        [selectedFilterColumn.value]: searchValue.value,
      }),
    filters: {
      ...selectedFilters.value,
      ...getActiveFilters(),
    },
  });
  isLoading.value = false;

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

  // Type filtering is now done on the server side, but we keep client-side filtering as fallback
  // This ensures compatibility if server-side filtering is not available
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

  // Search filtering is now done on the server side via API parameters
  // No need for client-side search filtering
  // attach original jsonld to each row for downstream converters
  filteredData = filteredData.map((row: TableRowData) => {
    const id = String(row.id);
    const original = rawById.value[id];
    return {
      ...row,
      _raw: original,
      _rawJson: original !== undefined ? JSON.stringify(original) : undefined,
    } as unknown as TableRowData;
  });
  data.value = filteredData;
};

const columnFilters = ref<ColumnFiltersState>(
  route.query.filters && typeof route.query.filters === "string"
    ? JSON.parse(decodeURIComponent(route.query.filters))
    : []
);
const columnVisibility = ref<VisibilityState>(
  route.query.visibility && typeof route.query.visibility === "string"
    ? JSON.parse(decodeURIComponent(route.query.visibility))
    : {}
);
const rowSelection = ref<Record<string, boolean>>({});
const expanded = ref<ExpandedState>({});

const currentPage = ref<number>(
  route.query.page && typeof route.query.page === "string"
    ? parseInt(route.query.page)
    : 0
);

const getColumns = (cols: TableColumn[] | undefined) => {
  if (!cols) return [];
  return cols.map((item) => ({
    id: item.id,
    accessorKey: item.id,
    header: t(`column.${item.id}`),
    cell: item.cell,
  }));
};

const selectedRows = ref<Row<TableRowData>[]>([]);

const mappedColumns = ref(getColumns(columns));
const isSelectionVisible = computed(
  () => props.selectionEnabled && selectedType.value === "datasets"
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
  enableMultiRowSelection: true,
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
      (filter) => filter.id === "search"
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

const openAddDataset = ref(false);
const isUpdatingFromState = ref(false);

const applySearchFilter = () => {
  columnFilters.value = columnFilters.value.filter(
    (filter) => filter.id !== "search"
  );
  if (!searchValue.value) {
    updateURLQuery();
    fetchData();
    return;
  }
  const searchFilter: TableFilter = {
    id: "search",
    value: searchValue.value,
    column: selectedFilterColumn.value,
  };
  columnFilters.value.push(searchFilter as unknown as TableFilter);
  updateURLQuery();
  fetchData();
};

watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState.value) return;
    console.log("=== Route query changed ===", newQuery);
    isUpdatingFromState.value = true;
    try {
      // Update type
      if (newQuery.type && typeof newQuery.type === "string") {
        selectedType.value = newQuery.type;
      } else {
        selectedType.value = "datasets";
      }

      // Update search
      if (newQuery.search && typeof newQuery.search === "string") {
        searchValue.value = newQuery.search;
        selectedFilterColumn.value =
          (newQuery.searchColumn as string) || "all";
      } else {
        searchValue.value = "";
        selectedFilterColumn.value = "all";
      }

      // Update selectedFilters
      if (newQuery.filters && typeof newQuery.filters === "string") {
        try {
          const decoded = decodeURIComponent(newQuery.filters);
          console.log("Watch - Decoded filters from URL:", decoded);
          const parsedFilters = JSON.parse(decoded);
          console.log("Watch - Parsed filters:", parsedFilters);
          selectedFilters.value = parsedFilters;
          // Sync filters to UI - use double nextTick to ensure filterGroups are ready
          nextTick(() => {
            nextTick(() => {
              syncFiltersToUI(parsedFilters);
            });
          });
        } catch (e) {
          console.error("Error parsing filters from URL:", e);
          selectedFilters.value = {};
          nextTick(() => {
            nextTick(() => {
              syncFiltersToUI({});
            });
          });
        }
      } else {
        selectedFilters.value = {};
        nextTick(() => {
          nextTick(() => {
            syncFiltersToUI({});
          });
        });
      }

      // Update columnFilters (for backward compatibility)
      if (newQuery.filters && typeof newQuery.filters === "string") {
        columnFilters.value = JSON.parse(decodeURIComponent(newQuery.filters));
        const currentColumnFilters = columnFilters.value;
        if (currentColumnFilters.length > 0) {
          const searchFilter = currentColumnFilters.find(
            (filter) => filter.id === "search"
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
          decodeURIComponent(newQuery.visibility)
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
      setTimeout(() => {
        isUpdatingFromState.value = false;
        fetchData();
      }, 100);
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => pageSize,
  (newPageSize) => {
    table.setPageSize(newPageSize);
    currentPage.value = 0;
    updateURLQuery();
    fetchData();
  }
);

// Watch for searchValue changes and update URL (with debounce for search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
  searchValue,
  () => {
    if (!isUpdatingFromState.value) {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        updateURLQuery();
      }, 300); // Debounce 300ms
    }
  }
);

// Watch for other changes and update URL immediately
watch(
  [selectedFilterColumn, selectedType],
  () => {
    if (!isUpdatingFromState.value) {
      updateURLQuery();
    }
  }
);

watch(
  selectedFilters,
  () => {
    if (!isUpdatingFromState.value) {
      updateURLQuery();
    }
  },
  { deep: true }
);

onMounted(() => {
  console.log("onMounted - selectedFilters:", selectedFilters.value);
  console.log("onMounted - route.query.filters:", route.query.filters);
  console.log("onMounted - filterGroups:", filterGroups.value);
  
  // Sync filters from URL to UI on mount - ensure filterGroups are ready
  // Use double nextTick to ensure everything is initialized
  nextTick(() => {
    nextTick(() => {
      if (selectedFilters.value && Object.keys(selectedFilters.value).length > 0) {
        console.log("Syncing filters on mount:", selectedFilters.value);
        syncFiltersToUI(selectedFilters.value);
      } else if (route.query.filters && typeof route.query.filters === "string") {
        // Also try to read from route.query directly if selectedFilters is empty
        try {
          const decoded = decodeURIComponent(route.query.filters);
          const parsed = JSON.parse(decoded);
          console.log("Reading filters from route.query on mount:", parsed);
          selectedFilters.value = parsed;
          syncFiltersToUI(parsed);
        } catch (e) {
          console.error("Error parsing filters from route.query on mount:", e);
        }
      }
    });
  });
  
  // Update URL with current state if not present in URL
  if (!route.query.type && !route.query.search && !route.query.filters) {
    updateURLQuery();
  }
  fetchData();
});

watch(
  rowSelection,
  () => {
    const ids = table
      .getSelectedRowModel()
      .rows.map((r) => String((r.original as TableRowData).id));
    console.debug("ids", ids);
    selectedRows.value = table.getSelectedRowModel().rows;
    emit("selection-change", ids);
  },
  { deep: true }
);

const filterItems = computed<DropdownMenuItem[]>(() =>
  filterGroups.value.map((group) => ({
    key: group.key,
    label: t(`filters.${group.key}`),
    children: group.items.map((item) => ({
      key: item.key,
      type: item.type,
      value: item.key,
      label: t(`filters.${item.key}`),
    })),
  }))
);

// Compute selected filter keys from selectedFilters and filterGroups
// Priority: filterGroups.value (UI state) > selectedFilters (URL state)
const selectedFilterKeys = computed(() => {
  const keys: string[] = [];
  
  // First, check filterGroups for selected items (UI state is source of truth)
  filterGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      if (item.value !== null && item.value !== false && !keys.includes(item.key)) {
        keys.push(item.key);
      }
    });
  });
  
  // Also add keys from selectedFilters that might not be in filterGroups yet
  Object.keys(selectedFilters.value).forEach((key) => {
    if (selectedFilters.value[key] !== false && selectedFilters.value[key] !== null && !keys.includes(key)) {
      keys.push(key);
    }
  });
  
  console.log("selectedFilterKeys computed:", keys, "selectedFilters:", selectedFilters.value, "filterGroups items:", filterGroups.value.flatMap(g => g.items.map(i => ({ key: i.key, value: i.value }))));
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
    ((typeof raws[0]["@type"] === "string" &&
      String(raws[0]["@type"]).includes("dcat:Dataset")) ||
      (Array.isArray(raws[0]["@type"]) &&
        (raws[0]["@type"] as unknown[]).some((t) =>
          String(t).includes("dcat:Dataset")
        )));

  const inputForConverter = looksJsonLdDataset
    ? ({ "dcat:dataset": raws } as unknown)
    : ({ dataset: raws } as unknown);

  const payload = convertJsonLdForTraining(inputForConverter);
  console.debug("training payload", payload);
  emit(
    "pass-to-training",
    payload as { dataset: Array<Record<string, unknown>> }
  );
};

const handleClearAll = () => {
  console.log("clear all");
  rowSelection.value = {};
};

const handleCreate = () => {
  console.log("create");
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
  <div class="w-full flex flex-col py-4 h-[calc(100vh-50px)] relative">
    <div
      v-if="hasSourceHeader"
      class="flex items-center justify-between gap-2 mb-4"
    >
      <div class="flex items-center gap-2">
        <AppHeaderSource />
      </div>
      <div class="flex items-center gap-2">
        <Button class="cursor-pointer" @click="handleCreate">{{
          t("action.add_new_item")
        }}</Button>
      </div>
    </div>
    <div class="mb-4 flex items-center justify-between gap-2">
      <Tabs
        :model-value="selectedType"
        @update:model-value="handleTypeTabChange"
      >
        <TabsList class="flex mx-auto justify-center items-center mx-auto">
          <TabsTrigger value="datasets">
            <Icon name="lucide:table-2" />
            {{ isMyCatalog ? $t("hint.your") : "" }} {{ $t("action.datasets") }}
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Icon name="lucide:box" />
            {{ isMyCatalog ? $t("hint.your") : "" }}
            {{ $t("action.applications") }}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div class="flex gap-2 items-center">
        <div class="flex-auto flex flex-wrap gap-2">
          <div class="flex gap-2 relative max-w-sm items-center">
            <Input
              v-model="searchValue"
              class="w-64 pl-8"
              type="search"
              :placeholder="t('placeholder.search', { type: selectedType })"
              @update:model-value="applySearchFilter"
            />
            <span
              class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
            >
              <Icon name="lucide:search" />
            </span>
          </div>

          <AppTableDropdownFilter
            id="filter"
            label="filter"
            :items="filterItems"
            :selected-values="selectedFilterKeys"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>
    </div>
    <div class="filters-list">
      <div
        v-if="Object.keys(selectedFilters).length > 0"
        class="flex gap-2 items-center flex-wrap my-4 mb-6"
      >
        <Button
          variant="default"
          size="sm"
          class="rounded-sm px-2 text-sm py-0 font-normal h-6"
          @click="handleClearAllFilters"
        >
          {{ t("action.clear_filters") }}
        </Button>
        <Badge
          v-for="(value, key) in selectedFilters"
          :key="key"
          variant="secondary"
          class="rounded-sm px-2 text-sm capitalize h-6"
        >
          {{ t(`filter.${key}`) }}
          <Button
            variant="ghost"
            size="icon"
            class="p-0 h-auto w-auto ml-1"
            @click.stop="handleRemoveFilter(key as string)"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </Badge>
      </div>
    </div>
    <!-- end table filters -->
    <AppTablePreloader v-if="isLoading" />
    <div
      v-else
      class="flex-grow overflow-auto flex flex-col border rounded-md mb-2"
    >
      <Table
        :data-source="dataSource"
        :columns="columns"
        :page-size="pageSize"
        :title="title"
      >
        <TableHeader
          class="sticky top-0 bg-gray-50 z-10 outline outline-1 outline-gray-200"
        >
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-if="isSelectionVisible">
              <div class="flex items-center justify-center">
                <Checkbox
                  :model-value="
                    table.getIsAllRowsSelected()
                      ? true
                      : table.getIsSomeRowsSelected()
                      ? 'indeterminate'
                      : false
                  "
                  aria-label="select all"
                  class="cursor-pointer border-primary"
                  @update:model-value="(v) => table.toggleAllRowsSelected(!!v)"
                />
              </div>
            </TableHead>
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-if="isSelectionVisible">
                  <div class="flex items-center justify-center">
                    <Checkbox
                      :model-value="row.getIsSelected()"
                      :disabled="!row.getCanSelect()"
                      aria-label="select row"
                      class="cursor-pointer border-primary"
                      @update:model-value="(v) => row.toggleSelected(!!v)"
                    />
                  </div>
                </TableCell>
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="mappedColumns.length + (isSelectionVisible ? 1 : 0)"
              class="h-24 text-center"
            >
              {{ t("hint.no_results") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <AppTableRowMenu
      v-if="selectedRows.length > 0"
      :rows="selectedRows"
      @on-pass-to-training="handlePassToTraining"
      @on-clear-all="handleClearAll"
    />

    <!-- <AppTablePagination
      :current-page="currentPage"
      :total-pages="Math.ceil(totalItems / pageSize)"
      :total-items="totalItems"
      :page-size="pageSize"
      :can-previous-page="currentPage > 0"
      :can-next-page="currentPage < Math.ceil(totalItems / pageSize) - 1"
      @page-change="handlePageChange"
    /> -->
    <AppDialogDataset
      :open="openAddDataset"
      @on-close="() => (openAddDataset = false)"
    />
  </div>
</template>
