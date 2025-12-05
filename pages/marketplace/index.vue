<template>
  <AppContent
    :title="t('title.marketplace')"
    :description="t('subtitle.marketplace')"
    :show-available-biobanks="true"
  >
    <AppTable
      title="marketplace"
      :columns="columns"
      :data-source="fetchTableData"
      @pass-to-training="handlePassToTraining"
    />
    <TrainingSuccessDialog
      :open="showSuccessDialog"
      :pipeline-id="successData?.data?.id"
      :pipeline-name="successData?.data?.pipeline_name"
      :order-id="successData?.data?.order_id"
      @on-close="showSuccessDialog = false"
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
  createFiltersObject,
} from "~/utils/jsonld";
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";

import type { SearchFilter } from "~/types/api.types";

const { t } = useI18n();
const dayjs = useDayjs();
const { page, setPage } = useApp();
const api = useApi();

const showSuccessDialog = ref(false);
const successData = ref<{
  status_code: number;
  message: string;
  data: {
    id: string;
    pipeline_name: string;
    order_id: string;
    status: string;
  };
} | null>(null);

const handlePassToTraining = async (payload: {
  dataset: Array<Record<string, unknown>>;
}) => {
  console.log(
    "[marketplace/index.vue] handlePassToTraining called with payload:",
    payload
  );
  console.log(
    "[marketplace/index.vue] Calling api.runFederatedTraining with datasets:",
    payload.dataset
  );
  const response = await api.runFederatedTraining(payload.dataset);
  console.log("[marketplace/index.vue] API response:", response);
  if (response) {
    successData.value = response;
    showSuccessDialog.value = true;
  }
};

setPage({
  section: "marketplace",
  title: t("title.marketplace"),
  subtitle: t("subtitle.marketplace"),
  source: "uva",
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
    id: "biobank",
    cell: ({ row }) => row.getValue("biobank"),
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
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 3);

    // Debug: log search parameters
    console.log("Search params:", {
      name: params.name,
      description: params.description,
      all: params.all,
      type: params.type,
      biobank: params.biobank,
    });

    const filtersObj = createFiltersObject(params.filters || {});
    const filter = createTableSearchFilter({
      name: params.name,
      description: params.description,
      biobank: params.biobank,
      lastupdate: params.lastupdate,
      all: params.all,
      type: params.type,
      page,
      limit,
      filters: filtersObj.length > 0 ? filtersObj : undefined,
    });

    // Debug: log the filter being sent
    console.log("Filter being sent to API:", JSON.stringify(filter, null, 2));
    const response = await api.searchDistributed(filter as SearchFilter);
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
      originals: tableData.originals,
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
