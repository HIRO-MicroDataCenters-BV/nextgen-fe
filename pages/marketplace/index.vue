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
      :order-id="successData?.data?.order_id"
      @update:open="showSuccessDialog = $event"
    />
  </AppContent>
</template>

<script setup lang="ts">
import type {
  CatalogItem,
  TableFetchParams,
  TableDataResponse,
} from "~/types/catalog.types";
import type { TableColumn } from "~/types/table.types";
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
  const checkoutResponse = await api.checkout(payload.dataset);
  if (!checkoutResponse) {
    return;
  }

  successData.value = {
    status_code: 201,
    message: "Order created successfully",
    data: {
      id: "",
      pipeline_name: "",
      order_id: checkoutResponse.order_id,
      status: "CREATED",
    },
  };
  showSuccessDialog.value = true;
};

setPage({
  section: "marketplace",
  title: t("title.marketplace"),
  subtitle: t("subtitle.marketplace"),
  source: "uva",
});

const baseUrl = page.value.section;

// Defining columns for the table
const columns: TableColumn[] = [
  {
    id: "name",
    icon: "lucide:text",
    header: () => t("column.name"),
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id;

      return h(Button, {
        as: "a",
        variant: "link",
        class: "p-0",
        href: `${baseUrl}/${id}`,
      }, {
        default: () => String(row.getValue("name") ?? ""),
      });
    },
  },
  {
    id: "biobank",
    icon: "lucide:users",
    header: () => t("column.biobank"),
    cell: ({ row }) => row.getValue("biobank"),
  },
  {
    id: "issued",
    icon: "lucide:calendar",
    header: () => t("column.issued"),
    cell: ({ row }) => dayjs(row.getValue("issued")).format("DD/MM/YYYY"),
  },
];

const fetchTableData = async (
  paramsAsUnknown: unknown
): Promise<TableDataResponse> => {
  const params = paramsAsUnknown as TableFetchParams;
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 3);

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
  } catch {
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
