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
console.log("my_catalog");
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
  data: CatalogItem[];
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
    id: "last_update",
    header: () => t("label.last_updated"),
    cell: ({ row }) =>
      dayjs(row.getValue("last_update") as string).format("DD/MM/YYYY"),
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

  // Create search filter based on table parameters
  const filter: SearchFilter = {
    "@context": {
      "@vocab": "http://data-space.org/",
      dcat: "http://www.w3.org/ns/dcat#",
      med: "http://oca.example.org/123/",
    },
    "@type": "Filters",
    filters: [],
  };

  // Add search filters if provided
  if (
    params.name ||
    params.description ||
    params.biobank ||
    params.lastupdate ||
    params.all
  ) {
    const searchFilter: Record<string, unknown> = {
      "@type": "SearchFilter",
    };

    if (params.name) {
      searchFilter["dcterms:title"] = params.name;
    }
    if (params.description) {
      searchFilter["dcterms:description"] = params.description;
    }
    if (params.biobank) {
      searchFilter["dspace:biobank"] = params.biobank;
    }
    if (params.lastupdate) {
      searchFilter["dcterms:modified"] = params.lastupdate;
    }
    if (params.all) {
      searchFilter["dspace:search"] = params.all;
    }

    filter.filters.push(searchFilter);
  }

  // Add pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  filter.filters.push({
    "@type": "PaginationFilter",
    "dspace:page": page,
    "dspace:pageSize": limit,
  });

  try {
    const response = await api.searchDecentralized(filter);

    console.log("RESPONSE", response);

    if (!response) {
      return {
        data: [],
        pagination: {
          total_items: 0,
          page,
          limit,
        },
      };
    }

    // Transform API response to table format
    const processedData: CatalogItem[] = response.results.map(
      (item: JsonLdObject) => {
        const title = Array.isArray(item["dcterms:title"])
          ? (item["dcterms:title"][0] as JsonLdValue)?.["@value"] || ""
          : "";

        const description = Array.isArray(item["dcterms:description"])
          ? (item["dcterms:description"][0] as JsonLdValue)?.["@value"] || ""
          : "";

        const biobank =
          (item["dspace:biobank"] as JsonLdValue)?.["@value"] || "";
        const lastUpdate =
          (item["dcterms:modified"] as JsonLdValue)?.["@value"] || "";

        return {
          id: String(item["@id"] || ""),
          name: title,
          description,
          biobank,
          last_update: lastUpdate,
        };
      }
    );

    return {
      data: processedData,
      pagination: {
        total_items: response.metadata?.total || 0,
        page: response.metadata?.page || page,
        limit: response.metadata?.pageSize || limit,
      },
    };
  } catch (error) {
    console.error("Error fetching catalog data:", error);
    return {
      data: [],
      pagination: {
        total_items: 0,
        page,
        limit,
      },
    };
  }
};

const config = useRuntimeConfig();
console.log(config.public);
</script>
