import { computed, ref, watch, type Ref } from "vue";
import type { ExpandedState, Row } from "@tanstack/vue-table";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { valueUpdater } from "~/utils";
import { createColumnHeader } from "~/utils/tableHelpers";
import type { TableColumn, TableRowData } from "~/types/table.types";

interface UseTableInstanceOptions {
  columns: TableColumn[];
  pageSize: number;
  selectionEnabled: boolean;
  selectionMode: "single" | "multiple";
  selectedType: Ref<string>;
  currentPage: Ref<number>;
  columnFilters: Ref<Array<{ id: string; value: unknown; column?: string }>>;
  columnVisibility: Ref<Record<string, boolean>>;
  data: Ref<TableRowData[]>;
  t: (key: string) => string;
  updateURLQuery: (replace?: boolean) => void;
  fetchData: () => Promise<void>;
  onSelectionChange: (ids: string[], rows: Row<TableRowData>[]) => void;
}

export const useTableInstance = (options: UseTableInstanceOptions) => {
  const rowSelection = ref<Record<string, boolean>>({});
  const expanded = ref<ExpandedState>({});
  const selectedRows = ref<Row<TableRowData>[]>([]);

  const mappedColumns = ref(
    options.columns.map((item) => ({
      id: item.id,
      accessorKey: item.id,
      header: () =>
        createColumnHeader(
          options.t(`column.${item.id}`),
          item.icon,
          item.iconOnly,
        ),
      cell: item.cell,
    })),
  );

  const isSelectionVisible = computed(
    () => options.selectionEnabled && options.selectedType.value === "datasets",
  );

  const table = useVueTable({
    data: options.data,
    columns: mappedColumns.value,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => String((row as TableRowData).id),
    enableRowSelection: true,
    enableMultiRowSelection: options.selectionMode === "multiple",
    onColumnFiltersChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, options.columnFilters),
    onColumnVisibilityChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, options.columnVisibility),
    onRowSelectionChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, rowSelection),
    onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
    manualPagination: true,
    globalFilterFn: (row, columnId) => {
      const searchFilter = options.columnFilters.value.find(
        (filter) => filter.id === "search",
      );
      if (!searchFilter) return true;
      if (searchFilter.column !== "all" && searchFilter.column !== columnId) {
        return true;
      }
      const value = row.getValue(columnId);
      return String(value)
        .toLowerCase()
        .includes(String(searchFilter.value).toLowerCase());
    },
    initialState: {
      pagination: {
        pageIndex: options.currentPage.value,
        pageSize: options.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater(table.getState().pagination)
          : updater;
      options.currentPage.value = newPagination.pageIndex;
      options.updateURLQuery();
      options.fetchData();
    },
    state: {
      get columnFilters() {
        return options.columnFilters.value;
      },
      get columnVisibility() {
        return options.columnVisibility.value;
      },
      get rowSelection() {
        return rowSelection.value;
      },
      get expanded() {
        return expanded.value;
      },
      get pagination() {
        return {
          pageIndex: options.currentPage.value,
          pageSize: options.pageSize,
        };
      },
    },
  });

  watch(
    rowSelection,
    () => {
      const rows = table.getSelectedRowModel().rows;
      const ids = rows.map((row) => String((row.original as TableRowData).id));
      selectedRows.value = rows;
      options.onSelectionChange(ids, rows);
    },
    { deep: true },
  );

  const clearSelection = () => {
    rowSelection.value = {};
  };

  return {
    table,
    mappedColumns,
    selectedRows,
    isSelectionVisible,
    clearSelection,
  };
};
