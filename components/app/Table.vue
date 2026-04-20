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
import TableToolbar from "@/components/app/table/TableToolbar.vue";
import TableGrid from "@/components/app/table/TableGrid.vue";

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

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { page } = useApp();
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

const isMyCatalog = computed(() => page.value.section === "my_catalog");
const { buildTrainingPayload } = useTrainingPayload();
const selectedRows = ref<Row<TableRowData>[]>([]);

function clearSelectionBridge() {
  clearSelection();
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

const { table, mappedColumns, isSelectionVisible, clearSelection } = useTableInstance({
  columns,
  pageSize,
  selectionEnabled: props.selectionEnabled,
  selectionMode: props.selectionMode,
  selectedType,
  currentPage,
  columnFilters,
  columnVisibility,
  data,
  t,
  updateURLQuery,
  fetchData,
  onSelectionChange: (ids, rows) => {
    selectedRows.value = rows;
    emit("selection-change", ids);
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
  clearSelection,
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
