<template>
  <AppContent
    :title="t('title.my_catalog')"
    :description="t('subtitle.my_catalog')"
  >
    <AppTable
      ref="tableRef"
      :title="'my_catalog'"
      :columns="columns"
      :data-source="fetchTableData"
      :page-size="10"
      :enable-pagination="true"
    />
  </AppContent>
</template>

<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "~/types/table.types";
import type {
  CatalogItem,
  TableFetchParams,
  TableDataResponse,
} from "~/types/catalog.types";
import type { JsonLdResponse } from "~/types/jsonld.types";
import {
  createTableSearchFilter,
  transformSearchResponseToTableData,
  createFiltersObject,
} from "~/utils/jsonld";
import { Button } from "@/components/ui/button";
import DropdownAction from "~/components/app/menu/Actions.vue";
import type { SearchFilter } from "~/types/api.types";


const { deleteDataset } = useApi();
const router = useRouter();
const { t } = useI18n();
const dayjs = useDayjs();
const tableRef = ref();
const { setPage } = useApp();
setPage({
  section: "my_catalog",
  title: t("title.my_catalog"),
  subtitle: t("subtitle.my_catalog"),
});


// Defining columns for the table
const columns: TableColumn[] = [
  {
    id: "name",
    header: () => t("label.data_product_name"),
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id
      
      return h(
        Button,
        {
          href: `/my_catalog/${id}`,
          as: "a",
          variant: "link",
        },
        () => [row.getValue("name") as string]
      );
    },
  },
  {
    id: "description",
    header: () => t("label.description"),
    cell: ({ row }) => row.getValue("description") as string,
  },
  {
    id: "issued",
    header: () => t("label.issued"),
    cell: ({ row }) =>
      dayjs(row.getValue("issued") as string).format("DD/MM/YYYY"),
  },
  {
    id: "actions",
    header: () => t("label.actions"),
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id;

      return h(DropdownAction, {
        title: row.getValue("name") as string,
        id,
        items: [
          {
            key: "delete_dataset",
            label: "delete_dataset",
            hasConfirmation: true,
            action: async () => {
              await deleteDataset(id);
              tableRef.value.fetchData();
            },
          },
          {
            key: "edit_dataset",
            label: "edit_dataset",
            action: () => {
              router.push(`/my_catalog/${id}/edit`);
            },
          }
        ],
      });
    },
  },
];

// Function to fetch data for the table using the API
const fetchTableData = async (
  paramsAsUnknown: unknown
): Promise<TableDataResponse> => {
  const params = paramsAsUnknown as TableFetchParams;
  const api = useApi();

  try {
    // Ensure we have valid pagination parameters
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 3); // Changed to 3 for testing

    const filtersObj = createFiltersObject(params.filters);
    const filter = createTableSearchFilter({
      name: params.name,
      description: params.description,
      biobank: params.biobank,
      lastupdate: params.lastupdate,
      all: params.all,
      page,
      limit,
      filters: params.filters && Object.keys(params.filters).length > 0
          ? filtersObj
          : undefined,
    });
    const response = await api.searchLocalCatalog(filter as SearchFilter);

    const tableData = transformSearchResponseToTableData(
      response as unknown as JsonLdResponse,
      page,
      limit
    );

    // Calculate total pages based on total items and page size
    const totalPages = Math.ceil(tableData.pagination.total_items / limit);

    // Update pagination info
    const updatedTableData: TableDataResponse = {
      data: tableData.data,
      pagination: {
        ...tableData.pagination,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };

    return updatedTableData;
  } catch (e) {
    console.log("Error fetching table data:", e);
    return {
      data: [],
      pagination: {
        total_items: 0,
        page: params.page || 1,
        limit: params.limit || 3,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
};
</script>
