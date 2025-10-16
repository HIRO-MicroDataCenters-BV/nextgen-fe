<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
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

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
}

const props = withDefaults(defineProps<TableProps>(), {
  title: "",
  columns: () => [],
  pageSize: 10,
});

const { dataSource, columns, pageSize, title } = props;

const { t } = useI18n();
const data = shallowRef<TableRowData[]>([]);
const totalItems = ref(0);
const isLoading = ref(true);

const selectedFilters = ref<Record<string, boolean | string | number>>({});

const {
  filterGroups,
  getActiveFilters,
  resetFilters: _resetFilters,
} = useFilters();

const handleFilterChange = (
  key: string,
  value: boolean | string | number,
  multiple: boolean
) => {
  if (!multiple) {
    selectedFilters.value = {};
  }

  if (value) {
    selectedFilters.value[key] = value;
  } else {
    delete selectedFilters.value[key];
  }

  searchValue.value = "";
  applySearchFilter();
  fetchData();
};

const fetchData = async () => {
  if (Object.keys(selectedFilters.value).length == 0) {
    console.log("no filters");
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  const { data: tableData, pagination } = await dataSource({
    page: table.getState().pagination.pageIndex + 1,
    limit: table.getState().pagination.pageSize,
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

  let filteredData = tableData ?? [];

  if (searchValue.value && searchValue.value.trim()) {
    const searchTerm = searchValue.value.toLowerCase().trim();
    filteredData = filteredData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }
  /*
  const start =
    table.getState().pagination.pageIndex *
    table.getState().pagination.pageSize;
  const end = start + table.getState().pagination.pageSize;
  data.value = filteredData.slice(start, end);
  totalItems.value = searchValue.value
    ? filteredData.length
    : pagination?.total_items ?? 0;
  */
  data.value = filteredData;
};

const selectedFilterColumn = ref("all");
const searchValue = ref("");

const route = useRoute();
/*
const router = useRouter();
*/

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

const handlePageChange = (page: number) => {
  currentPage.value = page;
  table.setPageIndex(page);
  fetchData();
};

const getColumns = (cols: TableColumn[] | undefined) => {
  if (!cols) return [];
  return cols.map((item) => ({
    id: item.id,
    accessorKey: item.id,
    header: t(`column.${item.id}`),
    cell: item.cell,
  }));
};

const mappedColumns = ref(getColumns(columns));
const table = useVueTable({
  data,
  columns: mappedColumns.value,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
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
    fetchData();
    return;
  }
  const searchFilter: TableFilter = {
    id: "search",
    value: searchValue.value,
    column: selectedFilterColumn.value,
  };
  columnFilters.value.push(searchFilter as unknown as TableFilter);
  fetchData();
};

watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState.value) return;
    isUpdatingFromState.value = true;
    try {
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
        } else {
          searchValue.value = "";
          selectedFilterColumn.value = "all";
        }
      } else {
        columnFilters.value = [];
        searchValue.value = "";
        selectedFilterColumn.value = "all";
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
  { deep: true }
);

watch(
  () => pageSize,
  (newPageSize) => {
    table.setPageSize(newPageSize);
    currentPage.value = 0;
    fetchData();
  }
);

onMounted(() => {
  fetchData();
});

const filterItems = ref<DropdownMenuItem[]>(
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

defineExpose({ fetchData });
</script>

<template>
  <div class="w-full flex flex-col py-4 h-[calc(100vh-50px)]">
    <div class="mb-8">
      <!-- table filters -->

      <div class="flex gap-2 items-center">
        <div class="flex-auto flex flex-wrap gap-2">
          <div class="flex gap-2 relative max-w-sm items-center">
            <Input
              v-model="searchValue"
              class="w-64 pl-8"
              type="search"
              :placeholder="t('placeholder.search')"
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
            @filter-change="handleFilterChange"
          />
        </div>
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
        v-if="Object.keys(selectedFilters).length > 0"
      >
        <TableHeader
          class="sticky top-0 bg-gray-50 z-10 outline outline-1 outline-gray-200"
        >
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
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
            <TableCell :colspan="mappedColumns.length" class="h-24 text-center">
              {{ t("hint.no_results") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div v-else class="flex-grow flex items-center justify-center">
        <div class="flex flex-col items-center justify-center">
          <div
            class="w-[48px] h-[48px] flex items-center justify-center border rounded-md mb-4"
          >
            <Icon name="lucide:search-slash" size="24" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium mb-2">
              {{ t("hint.no_datasets_found") }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ t("hint.try_changing_search_query_or_filters") }}
            </p>
          </div>
        </div>
      </div>
    </div>

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
