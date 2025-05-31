<template>
  <AppContent
    :title="t('title.marketplace')"
    :description="t('subtitle.marketplace')"
    :show-available-biobanks="true"
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
import type {
  CatalogItem,
  TableFetchParams,
  TableDataResponse,
} from "~/types/catalog.types";
import type { JsonLdResponse } from "~/types/jsonld.types";
import Button from "@/components/ui/button/Button.vue";
import {
  createTableSearchFilter,
  transformSearchResponseToTableData,
} from "~/utils/jsonld";
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";

import type { SearchFilter } from "~/types/api.types";

const { t } = useI18n();
const dayjs = useDayjs();
const { page, setPage } = useApp();

setPage({
  section: "marketplace",
  title: t("title.marketplace"),
  subtitle: t("subtitle.marketplace"),
});

const baseUrl = page.value.section;

// const mock = useMock();

// Defining columns for the table
const columns = [
  {
    id: "name",
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id;

      return h(
        Button,
        { as: "a", variant: "link", class: "p-0", href: `${baseUrl}/${id}` },
        row.getValue("name")
      );
    },
  },
  {
    id: "description",
    cell: ({ row }) => row.getValue("description"),
  },
  {
    id: "issued",
    cell: ({ row }) => dayjs(row.getValue("issued")).format("DD/MM/YYYY"),
  },
];

// Function to fetch data for the table from the mock data
const fetchTableData = async (
  paramsAsUnknown: unknown
): Promise<TableDataResponse> => {
  const params = paramsAsUnknown as TableFetchParams;
  const api = useApi();
  try {
    // Ensure we have valid pagination parameters
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 3); // Changed to 3 for testing
    const filter = createTableSearchFilter({
      name: params.name,
      description: params.description,
      biobank: params.biobank,
      lastupdate: params.lastupdate,
      all: params.all,
      page,
      limit,
      filters:
        params.filters && Object.keys(params.filters).length > 0
          ? params.filters
          : undefined,
    });
    const response = await api.searchDecentralized(filter as SearchFilter);
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
