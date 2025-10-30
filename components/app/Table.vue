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

interface TableProps {
  title?: string;
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  columns?: TableColumn[];
  pageSize?: number;
  selectionEnabled?: boolean;
}

const props = withDefaults(defineProps<TableProps>(), {
  title: "",
  columns: () => [],
  pageSize: 10,
  selectionEnabled: true,
});

const { dataSource, columns, pageSize, title } = props;

const { t } = useI18n();
const emit = defineEmits<{
  (e: "selection-change", value: Array<string>): void;
}>();
const data = shallowRef<TableRowData[]>([]);
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
    const { [key]: _, ...rest } = selectedFilters.value;
    selectedFilters.value = rest;
  }

  searchValue.value = "";
  applySearchFilter();
  fetchData();
};

const handleRemoveFilter = (key: string) => {
  const { [key]: _, ...rest } = selectedFilters.value;
  selectedFilters.value = rest;
  fetchData();
};

const handleClearAllFilters = () => {
  selectedFilters.value = {};
  searchValue.value = "";
  applySearchFilter();
};

const fetchData = async () => {
  rowSelection.value = {};
  //selectedFilters.value = { "med:age": true };
  if (Object.keys(selectedFilters.value).length === 0) {
    isLoading.value = false;
    data.value = [];
    return;
  }
  isLoading.value = true;
  const { data: tableData } = await dataSource({
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

  if (selectedType.value === "datasets") {
    filteredData = filteredData.filter((row) => {
      const datasetType = row.datasetType as string | undefined;
      return (
        !datasetType || datasetType === "http://purl.org/dc/dcmitype/Dataset"
      );
    });
  } else if (selectedType.value === "applications") {
    filteredData = filteredData.filter((row) => {
      const datasetType = row.datasetType as string | undefined;
      return datasetType === "http://purl.org/dc/dcmitype/Software";
    });
  }

  if (searchValue.value && searchValue.value.trim()) {
    const searchTerm = searchValue.value.toLowerCase().trim();
    filteredData = filteredData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }
  data.value = filteredData;
};

const selectedFilterColumn = ref("all");
const searchValue = ref("");

const route = useRoute();
const selectedType = ref("datasets");
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

const handleTypeTabChange = (type: string | number) => {
  selectedType.value = String(type);
  fetchData();
};

const handlePassToTraining = () => {
  console.log("pass to training");
  selectedRows.value = [];
  rowSelection.value = {};
};

const handleClearAll = () => {
  console.log("clear all");
  rowSelection.value = {};
};

defineExpose({ fetchData });
</script>

<template>
  <div class="w-full flex flex-col py-4 h-[calc(100vh-50px)] relative">
    <div class="mb-4 flex items-center justify-between gap-2">
      <!-- table filters -->
      <Tabs
        :model-value="selectedType"
        @update:model-value="handleTypeTabChange"
      >
        <TabsList class="flex mx-auto justify-center items-center mx-auto">
          <TabsTrigger value="datasets">
            <Icon name="lucide:table-2" />
            {{ $t("action.datasets") }}
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Icon name="lucide:box" />
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
        v-if="Object.keys(selectedFilters).length > 0"
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
                <input
                  type="checkbox"
                  :checked="table.getIsAllRowsSelected()"
                  :indeterminate="table.getIsSomeRowsSelected()"
                  aria-label="select all"
                  class="cursor-pointer border-primary size-4 !rounded-md"
                  @change="table.getToggleAllRowsSelectedHandler()($event)"
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
                    <input
                      type="checkbox"
                      :checked="row.getIsSelected()"
                      :disabled="!row.getCanSelect()"
                      aria-label="select row"
                      class="cursor-pointer border-primary size-4 rounded-md [&:checked]:bg-primary [&:checked]:text-primary-foreground"
                      @change="row.getToggleSelectedHandler()($event)"
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
