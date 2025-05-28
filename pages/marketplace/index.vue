<template>
  <AppContent
    :title="t('title.marketplace')"
    :description="t('subtitle.marketplace')"
  >
    <AppTable
      :title="'marketplace'"
      :columns="columns"
      :data-source="fetchTableData"
      :page-size="10"
    />
  </AppContent>
</template>

<script setup lang="ts">
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
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";

const { t } = useI18n();
const dayjs = useDayjs();
const { page, setPage } = useApp();

setPage({
  section: "marketplace",
});

const baseUrl = page.value.section;

const mock = useMock();

// Defining columns for the table
const columns = [
  {
    id: "id",
    cell: ({ row }) => row.getValue("id"),
  },
  {
    id: "name",
    cell: ({ row }) => row.getValue("name"),
  },
  {
    id: "biobank",
    cell: ({ row }) =>
      h(
        "a",
        { href: `${baseUrl}/${row.getValue("id")}` },
        row.getValue("biobank")
      ),
  },

  {
    id: "description",
    cell: ({ row }) => row.getValue("description"),
  },
  {
    id: "last_update",
    cell: ({ row }) => dayjs(row.getValue("last_update")).format("DD/MM/YYYY"),
  },
];

// Function to fetch data for the table from the mock data
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
      filters: params.filters,
    });

    console.log("Created search filter:", JSON.stringify(filter, null, 2));
    const response = await api.searchDecentralized(filter);
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
