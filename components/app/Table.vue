<script setup lang="ts">
import type { Row } from "@tanstack/vue-table";
import type {
  TableColumn,
  TableDataResponse,
  TableRowData,
} from "~/types/table.types";
import { useFilters } from "~/composables/useFilters";
import { useTableQueryState } from "~/composables/useTableQueryState";
import { useTableDataSource } from "~/composables/table/useTableDataSource";
import { useTableActions } from "~/composables/table/useTableActions";
import { useTableFilterControls } from "~/composables/table/useTableFilterControls";
import { useTableInstance } from "~/composables/table/useTableInstance";
import { useTableStateSync } from "~/composables/table/useTableStateSync";
import { useTrainingPayload } from "~/composables/table/useTrainingPayload";
import { useTableTrainingOrderBridge } from "~/composables/table/useTableTrainingOrderBridge";
import TableToolbar from "@/components/app/table/TableToolbar.vue";
import TableGrid from "@/components/app/table/TableGrid.vue";
import TableCardList from "@/components/app/table/TableCardList.vue";

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
  selectionEnabled?: boolean;
  hasSourceHeader?: boolean;
  selectionMode?: "single" | "multiple";
  enableViewToggle?: boolean;
  itemHrefBase?: string;
  contentClass?: string;
  defaultView?: "table" | "card";
}

const props = withDefaults(defineProps<TableProps>(), {
  title: "",
  columns: () => [],
  pageSize: 10,
  selectionEnabled: true,
  hasSourceHeader: false,
  selectionMode: "multiple",
  enableViewToggle: false,
  itemHrefBase: undefined,
  contentClass: "mx-auto w-full max-w-[calc(840px+16px)] px-8",
  defaultView: "table",
});

const { dataSource, columns, pageSize, title, hasSourceHeader, selectionMode } =
  props;

// Persisted per-table so each toggle-enabled table remembers its last view;
// falls back to `defaultView` on first visit (before any toggle).
//
// Key on `itemHrefBase` (a stable route base like "/marketplace") rather than
// `title`: titles are often translated strings or runtime-config values, so a
// title-based key would change across locales and collide on "default" when the
// title is empty. Fall back to title, then a literal, for tables without a base.
//
// `initOnMounted` defers the localStorage read until after mount, so SSR and the
// first client render both use `defaultView` and agree. Without it the client
// reads the stored value during setup, and the initial DOM (table vs card) can
// diverge from the server's — the source of the hydration-mismatch warnings.
const viewMode = useLocalStorage<"table" | "card">(
  `table-view-mode:${props.itemHrefBase || props.title || "default"}`,
  props.defaultView,
  { initOnMounted: true },
);
const setViewMode = (value: "table" | "card") => {
  viewMode.value = value;
};

const emit = defineEmits<{
  (e: "selection-change", value: Array<string>): void;
  (
    e: "selection-context-change",
    value: {
      selectedType: string;
      selectedIds: string[];
      selectedRaw: Array<Record<string, unknown>>;
    },
  ): void;
  (
    e: "pass-to-training",
    value: { dataset: Array<Record<string, unknown>> },
  ): void;
}>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const {
  filterGroups,
  getActiveFilters,
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

const { buildTrainingPayload } = useTrainingPayload();
const {
  isMyCatalog,
  clearTrainingSelection,
  selectedDatasetId,
  selectedApplicationId,
  selectedDatasetName,
  selectedApplicationName,
} = useTableTrainingOrderBridge();
const selectedRows = ref<Row<TableRowData>[]>([]);

function clearSelectionBridge() {
  clearTableSelection();
}

const {
  data,
  rawById,
  isLoading,
  applyClientSearch,
  fetchData,
} = useTableDataSource({
  dataSource,
  selectedType,
  selectedFilters,
  clientSearchTerm,
  getActiveFilters: () =>
    getActiveFilters() as Record<string, boolean | string | number>,
  getPagination: () => ({
    page: currentPage.value + 1,
    limit: pageSize,
  }),
  clearSelection: clearSelectionBridge,
});

const { table, mappedColumns, isSelectionVisible, clearSelection: clearTableSelection } = useTableInstance({
  columns,
  pageSize,
  selectionEnabled: props.selectionEnabled,
  selectionMode: props.selectionMode,
  selectedType,
  currentPage,
  isUpdatingFromState,
  columnFilters,
  columnVisibility,
  data,
  selectedDatasetId,
  selectedApplicationId,
  selectedDatasetName,
  selectedApplicationName,
  t,
  updateURLQuery,
  fetchData,
  onSelectionChange: (ids, rows) => {
    selectedRows.value = rows;
    emit("selection-change", ids);
    if (ids.length === 0) return;
    emit("selection-context-change", {
      selectedType: selectedType.value,
      selectedIds: ids,
      selectedRaw: rows
        .map((row) => {
          const id = String((row.original as TableRowData).id);
          const raw = rawById.value[id];
          if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
          }
          return row.original as unknown as Record<string, unknown>;
        })
        .filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === "object" && !Array.isArray(item),
        ),
    });
  },
});

const {
  filterItems,
  filterLabelByKey,
  selectedFilterKeys,
  handleFilterChange,
  handleRemoveFilter,
  handleClearAllFilters,
} = useTableFilterControls({
  filterGroups,
  selectedFilters,
  searchValue,
  clientSearchTerm,
  selectedFilterColumn,
  currentPage,
  isUpdatingFromState,
  applyClientSearch,
  updateURLQuery,
  fetchData,
  resetPageIndex: () => table.setPageIndex(0),
});

watch(
  () => pageSize,
  (newPageSize) => {
    table.setPageSize(newPageSize);
    currentPage.value = 0;
    updateURLQuery();
    fetchData();
  },
);

useTableStateSync({
  route,
  filterGroups,
  selectedFilters,
  isUpdatingFromState,
  selectedType,
  searchValue,
  clientSearchTerm,
  selectedFilterColumn,
  columnFilters,
  columnVisibility,
  currentPage,
  updateURLQuery,
  applyClientSearch,
  fetchData,
  fetchFilters,
  syncSelectedFilters,
  setPageIndex: (value: number) => table.setPageIndex(value),
});

const {
  applySearchFilter,
  handleSearchUpdate,
  handleTypeTabChange,
  handlePassToTraining,
  handleClearAll,
  handleCreate,
  getSelectedRaw,
} = useTableActions({
  searchValue,
  clientSearchTerm,
  selectedType,
  applyClientSearch,
  updateURLQuery,
  fetchData,
  clearSelection: clearTableSelection,
  buildTrainingPayload,
  emitPassToTraining: (payload) => emit("pass-to-training", payload),
  selectedRows,
  getSelectedRowIds: () =>
    table
      .getSelectedRowModel()
      .rows.map((row) => String((row.original as TableRowData).id)),
  rawById,
});

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
      :selected-dataset-name="selectedDatasetName"
      :selected-application-name="selectedApplicationName"
      :enable-view-toggle="enableViewToggle"
      :view-mode="viewMode"
      :content-class="contentClass"
      @create="handleCreate"
      @type-change="handleTypeTabChange"
      @search-update="handleSearchUpdate"
      @apply-search="applySearchFilter"
      @filter-change="handleFilterChange"
      @clear-all-filters="handleClearAllFilters"
      @remove-filter="handleRemoveFilter"
      @clear-selected-dataset="clearTrainingSelection('datasets')"
      @clear-selected-application="clearTrainingSelection('applications')"
      @view-change="setViewMode"
    />
    <TableCardList
      v-if="enableViewToggle && viewMode === 'card'"
      :table="table"
      :is-selection-visible="isSelectionVisible"
      :selection-mode="selectionMode"
      :item-href-base="itemHrefBase"
      :can-create="hasSourceHeader"
      :content-class="contentClass"
      :is-loading="isLoading"
      @create="handleCreate"
    />
    <template v-else>
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
        :content-class="contentClass"
      />
    </template>
    <AppTableRowMenu
      :rows="selectedRows"
      @on-pass-to-training="handlePassToTraining"
      @on-clear-all="handleClearAll"
    />
  </div>
</template>
