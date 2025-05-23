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
import { ref, watch, onMounted } from "vue";
import { valueUpdater } from "~/utils";
/*
import { AppMenuActions } from '#components';
*/
import type {
  SearchFilter,
  TableColumn,
  TableDataResponse,
  DataItem,
} from "~/types/table.types";
import DialogDataset from "./DialogDataset.vue";
import TablePagination from "./table/Pagination.vue";
import { filters } from "~/constants";
import TableFilter from "~/components/app/TableFilter.vue";

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
}

const { title, dataSource, columns, pageSize = 10 } = defineProps<TableProps>();

const mock = useMock();

const { t } = useI18n();
const data = shallowRef<DataItem[]>([]);
const totalItems = ref(0);

const hasTableFilters = ref(true);
const fetchData = async () => {
  const { data: tableData, pagination } = await dataSource({
    page: table.getState().pagination.pageIndex + 1,
    limit: pageSize,
    ...(searchValue.value &&
      selectedFilterColumn.value && {
        [selectedFilterColumn.value]: searchValue.value,
      }),
  });
  data.value = tableData ?? [];
  totalItems.value = pagination?.total_items ?? 0;
};

const toggleTableFilters = () => {
  hasTableFilters.value = !hasTableFilters.value;
};

const selectedFilterColumn = ref("all");
const searchValue = ref("");

const route = useRoute();
/*
const router = useRouter();
*/

const columnFilters = ref<ColumnFiltersState>(
  route.query.filters
    ? JSON.parse(decodeURIComponent(route.query.filters as string))
    : []
);
const columnVisibility = ref<VisibilityState>(
  route.query.visibility
    ? JSON.parse(decodeURIComponent(route.query.visibility as string))
    : {}
);
const rowSelection = ref<Record<string, boolean>>({});
const expanded = ref<ExpandedState>({});

const currentPage = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 0
);

const getColumns = (list: TableColumn[]) => {
  return list.map((item) => {
    return {
      id: item.id,
      accessorKey: item.id,
      header: t(`column.${item.id}`),
      cell: item.cell,
    };
  });
};

const mappedColumns = ref(getColumns(columns ?? []));
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
    ) as SearchFilter | undefined;
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
      pageSize,
    },
  },
  onPaginationChange: (updater) => {
    const newPagination =
      typeof updater === "function"
        ? updater(table.getState().pagination)
        : updater;
    currentPage.value = newPagination.pageIndex;
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
        pageSize,
      };
    },
  },
});

const openAddDataset = ref(false);
const isUpdatingFromState = ref(false);

const addDataSet = () => {
  openAddDataset.value = true;
};
const applySearchFilter = () => {
  columnFilters.value = columnFilters.value.filter(
    (filter) => filter.id !== "search"
  );
  if (!searchValue.value) {
    return;
  }
  const searchFilter: SearchFilter = {
    id: "search",
    value: searchValue.value,
    column: selectedFilterColumn.value,
  };
  columnFilters.value.push(searchFilter as unknown as SearchFilter);
};
/*
const updateUrlParams = () => {
  if (isUpdatingFromState.value) return;

  const query: Record<string, string> = {};
  if (columnFilters.value.length > 0) {
    query.filters = encodeURIComponent(JSON.stringify(columnFilters.value));
  }

  if (Object.keys(columnVisibility.value).length > 0) {
    query.visibility = encodeURIComponent(
      JSON.stringify(columnVisibility.value),
    );
  }

  if (currentPage.value > 0) {
    query.page = currentPage.value.toString();
  }
  isUpdatingFromState.value = true;
  router.replace({ query }).then(() => {
    setTimeout(() => {
      isUpdatingFromState.value = false;
    }, 100);
    fetchData();
  });
};
*/
watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState.value) return;
    isUpdatingFromState.value = true;
    try {
      if (newQuery.filters) {
        columnFilters.value = JSON.parse(
          decodeURIComponent(newQuery.filters as string)
        );
        const filters = columnFilters.value;
        if (filters.length > 0) {
          const searchFilter = filters.find(
            (filter) => filter.id === "search"
          ) as SearchFilter | undefined;
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
      if (newQuery.visibility) {
        columnVisibility.value = JSON.parse(
          decodeURIComponent(newQuery.visibility as string)
        );
      } else {
        columnVisibility.value = {};
      }
      if (newQuery.page) {
        const pageIndex = parseInt(newQuery.page as string);
        currentPage.value = pageIndex;
        table.setPageIndex(pageIndex);
      } else {
        currentPage.value = 0;
        table.setPageIndex(0);
      }
    } catch (error) {
      console.error("Error parsing query parameters:", error);
      columnFilters.value = [];
      columnVisibility.value = {};
      currentPage.value = 0;
      table.setPageIndex(0);
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
  /*
  setTimeout(() => {
    if (Object.keys(route.query).length === 0) {
      updateUrlParams();
    }
  }, 50);
  */
});
</script>

<template>
  <div
    class="w-full flex flex-col px-12 py-4"
    style="height: calc(100vh - 80px)"
  >
    <div class="mb-8">
      <!-- table filters -->

      <div class="flex gap-2 items-center">
        <div class="flex-auto flex  flex-wrap gap-2">
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
          <template v-for="filter in filters" :key="filter.key">
            <TableFilter :filter="filter" />
          </template>
        </div>
      </div>
    </div>
    <!-- end table filters -->
    <div class="flex-grow overflow-auto flex flex-col border rounded-md mb-20">
      <Table>
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
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  {{ JSON.stringify(row.original) }}
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

    <TablePagination
      :current-page="currentPage"
      :total-pages="Math.ceil(totalItems / pageSize)"
      :total-items="totalItems"
      :page-size="pageSize"
      :filtered-items-count="table.getFilteredRowModel().rows.length"
      :can-previous-page="table.getCanPreviousPage()"
      :can-next-page="table.getCanNextPage()"
      @previous-page="table.previousPage()"
      @on-next-page="table.nextPage()"
      @on-first-page="table.setPageIndex(0)"
      @on-last-page="
        table.setPageIndex(Math.ceil(totalItems / pageSize) - 1)
      "
    />
    <DialogDataset
      :open="openAddDataset"
      @on-close="() => (openAddDataset = false)"
    />
  </div>
</template>
