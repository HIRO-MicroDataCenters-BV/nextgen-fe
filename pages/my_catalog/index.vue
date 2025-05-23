<template>
  <AppContent
    :title="t('title.my_catalog')"
    :description="t('subtitle.my_catalog')"
  >
    <AppTable
      :title="'my_catalog'"
      :columns="columns"
      :data-source="fetchTableData"
      :page-size="10"
    />
  </AppContent>
</template>

<script setup lang="ts">
import { h } from "vue";
import { useRouter } from "vue-router";
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";
import { Button } from "@/components/ui/button";
import type {
  SearchFilter,
  JsonLdValue,
  JsonLdObject,
} from "~/types/api.types";
import type { TableColumn } from "~/types/table.types";
import {
  createTableSearchFilter,
  transformSearchResponseToTableData,
} from "~/utils/jsonld";
import { Link } from "#components";
// import { Icon } from '#components';

const { t } = useI18n();
const dayjs = useDayjs();
const router = useRouter();

// Assuming mock might not be typed, provide a basic type for its data
interface MockDataItem {
  id: number; // Original ID is a number
  name: string;
  description: string;
  status: string;
  type: string; // This was used for biobank filtering
  biobank: string;
  last_update: string;
}

interface CatalogItem {
  id: string;
  name: string;
  biobank: string;
  description: string;
  last_update: string;
  [key: string]: string; // Add index signature to satisfy DataItem type
}

interface TableFetchParams {
  page?: number;
  limit?: number;
  name?: string;
  description?: string;
  biobank?: string;
  lastupdate?: string;
  all?: string;
}

interface TableDataResponse {
  data: Array<{
    id: string;
    name: string;
    description: string;
    biobank: string;
    last_update: string;
  }>;
  pagination: {
    total_items: number;
    page: number;
    limit: number;
  };
}

const mock = useMock() as Ref<{ data: MockDataItem[] }>; // Type useMock if possible

const navigateToEdit = (id: string) => {
  router.push(`/my_catalog/${id}/edit`);
};

// Defining columns for the table
const columns: TableColumn[] = [
  {
    id: "name",
    header: () => t("label.data_product_name"),
    cell: ({ row }) => row.getValue("name") as string,
  },
  {
    id: "biobank",
    header: () => t("label.biobank"),
    cell: ({ row }) => row.getValue("biobank") as string,
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
      return h("div", { class: "flex space-x-2" }, [
        h(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => navigateToEdit(item.id),
          },
          () => [
            h("Icon", { name: "lucide:file-edit", class: "mr-1 h-4 w-4" }),
            t("action.edit"),
          ]
        ),
      ]);
    },
    enableSorting: false,
    enableHiding: false,
  },
];

// Function to fetch data for the table using the API
const fetchTableData = async (
  paramsAsUnknown: unknown
): Promise<TableDataResponse> => {
  const params = paramsAsUnknown as TableFetchParams;
  const api = useApi();

  try {
    const filter = createTableSearchFilter({
      name: params.name,
      description: params.description,
      biobank: params.biobank,
      lastupdate: params.lastupdate,
      all: params.all,
      page: params.page,
      limit: params.limit,
    });

    const response = await api.searchDecentralized(filter);

    const tableData = transformSearchResponseToTableData(
      response,
      params.page,
      params.limit
    );

    return tableData;
  } catch (error) {
    return {
      data: [],
      pagination: {
        total_items: 0,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    };
  }
};
</script>
