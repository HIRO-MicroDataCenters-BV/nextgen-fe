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
      :page-size="3"
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
} from "~/utils/jsonld";
import { Button } from "@/components/ui/button";
import DropdownAction from "~/components/app/menu/Actions.vue";
import type { SearchFilter } from "~/types/api.types";

const { deleteDataset } = useApi();

const { t } = useI18n();
const dayjs = useDayjs();
const router = useRouter();
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
      const idArr = item.id.split("/");
      const id = item.id.includes("/") ? idArr[idArr.length - 1] : item.id;
      
      return h(
        Button,
        {
          onClick: () => router.push(`/my_catalog/${id}`),
          variant: "link",
          class: "p-0 h-auto font-normal text-left justify-start",
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
    id: "license",
    header: () => t("label.license"),
    cell: ({ row }) =>
      h(
        Button,
        {
          onClick: () =>
            window.open(row.getValue("license") as string, "_blank"),
          variant: "link",
        },
        () => [t("action.view")]
      ),
  },
  {
    id: "actions",
    header: () => t("label.actions"),
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id;
      console.log(id);

      return h(DropdownAction, {
        title: row.getValue("dataset_name") as string,
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

  console.log("Received params in fetchTableData:", params);

  try {
    // Ensure we have valid pagination parameters
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 3); // Changed to 3 for testing

    console.log("Using pagination params:", { page, limit });

    const filter = createTableSearchFilter({
      name: params.name,
      description: params.description,
      biobank: params.biobank,
      lastupdate: params.lastupdate,
      all: params.all,
      page,
      limit,
      filters: params.filters && Object.keys(params.filters).length > 0
          ? params.filters
          : undefined,
    });

    console.log("Created search filter:", JSON.stringify(filter, null, 2));
    const response = await api.searchLocalCatalog(filter as SearchFilter);
    console.log("API response:", response);

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

    console.log("Transformed table data:", updatedTableData);

    return updatedTableData;
  } catch (error) {
    console.error("Error fetching table data:", error);
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
