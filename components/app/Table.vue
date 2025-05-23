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

const selectedFilters = ref<Record<string, boolean>>({});

const handleFilterChange = (key: string, value: boolean) => {
  selectedFilters.value[key] = value;
  fetchData();
};

const fetchData = async () => {
  console.log("Fetching data with params:", {
    page: table.getState().pagination.pageIndex + 1,
    limit: table.getState().pagination.pageSize,
    searchValue: searchValue.value,
    selectedFilterColumn: selectedFilterColumn.value,
    selectedFilters: selectedFilters.value,
  });

  isLoading.value = true;

  const { data: tableData, pagination } = await dataSource({
    page: table.getState().pagination.pageIndex + 1,
    limit: table.getState().pagination.pageSize,
    ...(searchValue.value &&
      selectedFilterColumn.value && {
        [selectedFilterColumn.value]: searchValue.value,
      }),
    filters: selectedFilters.value,
  });

  isLoading.value = false;

  // Slice the data based on current page and page size
  const start =
    table.getState().pagination.pageIndex *
    table.getState().pagination.pageSize;
  const end = start + table.getState().pagination.pageSize;
  data.value = tableData?.slice(start, end) ?? [];
  totalItems.value = pagination?.total_items ?? 0;

  console.log("Processed data:", {
    start,
    end,
    totalItems: totalItems.value,
    currentPage: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
    dataLength: data.value.length,
  });
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
  console.log("Page changed to:", page);
  currentPage.value = page;
  table.setPageIndex(page);
  fetchData();
};

const handlePageSizeChange = (size: number) => {
  console.log("Page size changed to:", size);
  table.setPageSize(size);
  currentPage.value = 0;
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
    return;
  }
  const searchFilter: TableFilter = {
    id: "search",
    value: searchValue.value,
    column: selectedFilterColumn.value,
  };
  columnFilters.value.push(searchFilter as unknown as TableFilter);
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

const filterItems = ref<DropdownMenuItem[]>([
  {
    key: "status",
    label: t("filter.status"),
    children: [
      {
        key: "isDeleted",
        type: "checkbox",
        value: "isDeleted",
        label: t("filter.isDeleted"),
      },
      {
        key: "isShared",
        type: "checkbox",
        value: "isShared",
        label: t("filter.isShared"),
      },
    ],
  },
]);

const filters = computed<DropdownMenuItem[]>(() => [
  {
    key: "all",
    type: "checkbox",
    value: "all",
    label: t("filter.all"),
  },
  {
    key: "name",
    type: "checkbox",
    value: "name",
    label: t("filter.name"),
  },
  {
    key: "description",
    type: "checkbox",
    value: "description",
    label: t("filter.description"),
  },
]);
</script>

<template>
  <div class="w-full flex flex-col px-12 py-4 h-[calc(100vh-120px)]">
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
      class="flex-grow overflow-auto flex flex-col border rounded-md mb-20"
    >
      <Table
        :data-source="dataSource"
        :columns="columns"
        :page-size="pageSize"
        :title="title"
      >
        <TableHeader class="sticky top-0 bg-sidebar-background">
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
    </div>

    <AppTablePagination
      :current-page="currentPage"
      :total-pages="Math.ceil(totalItems / pageSize)"
      :total-items="totalItems"
      :page-size="pageSize"
      :can-previous-page="currentPage > 0"
      :can-next-page="currentPage < Math.ceil(totalItems / pageSize) - 1"
      @page-change="handlePageChange"
    />
    <AppDialogDataset
      :open="openAddDataset"
      @on-close="() => (openAddDataset = false)"
    />
  </div>
</template>
