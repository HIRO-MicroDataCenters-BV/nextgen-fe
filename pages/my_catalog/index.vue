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
import { h } from 'vue';
import { useRouter } from 'vue-router';
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";
import { Button } from '@/components/ui/button';
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
  id: string; // ID must be a string for the table
  name: string;
  biobank: string;
  description: string;
  last_update: string;
  // Add other fields from MockDataItem if they are directly used or transformed
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
const columns = [
  {
    id: "name",
    header: () => t('label.data_product_name'),
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => row.getValue("name"),
  },
  {
    id: "biobank", // Or perhaps 'type' if that's more accurate from mock data
    header: () => t('label.biobank'),
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => row.getValue("biobank"),
  },
  {
    id: "description",
    header: () => t('label.description'),
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => row.getValue("description"),
  },
  {
    id: "last_update",
    header: () => t('label.last_updated'),
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => dayjs(row.getValue("last_update")).format("DD/MM/YYYY"),
  },
  {
    id: "actions",
    header: () => t('label.actions'),
    cell: ({ row }: { row: { original: CatalogItem } }) => h('div', { class: 'flex space-x-2' }, [
      h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => navigateToEdit(row.original.id),
      }, () => [
        h('Icon', { name: 'lucide:file-edit', class: 'mr-1 h-4 w-4' }), // Using h for Icon as well
        t('action.edit')
      ])
    ]),
    enableSorting: false,
    enableHiding: false,
  },
];

// Function to fetch data for the table from the mock data
const fetchTableData = async (paramsAsUnknown: unknown): Promise<TableDataResponse> => {
  const params = paramsAsUnknown as TableFetchParams;
  // Importing mock data
  const mockData = mock.value.data;

  // Imitation of pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  // Filtering data based on the search parameters
  let filteredData = [...mockData];
  if (params.name) {
    filteredData = filteredData.filter((item) =>
      item.name.toLowerCase().includes(params.name!.toLowerCase())
    );
  }
  if (params.description) {
    filteredData = filteredData.filter((item) =>
      item.description.toLowerCase().includes(params.description!.toLowerCase())
    );
  }
  if (params.biobank) { // This filters on item.type
    filteredData = filteredData.filter((item) =>
      item.type.toLowerCase().includes(params.biobank!.toLowerCase())
    );
  }
  if (params.lastupdate) {
    filteredData = filteredData.filter((item) =>
      item.last_update.toLowerCase().includes(params.lastupdate!.toLowerCase())
    );
  }
  if (params.all) {
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(params.all!.toLowerCase()) ||
        item.description.toLowerCase().includes(params.all!.toLowerCase()) ||
        item.type.toLowerCase().includes(params.all!.toLowerCase()) || // for biobank column
        item.last_update.toLowerCase().includes(params.all!.toLowerCase())
    );
  }

  // Map data to CatalogItem and ensure id is a string
  const processedData: CatalogItem[] = filteredData.slice(start, end).map(item => ({
    ...item,
    id: String(item.id), // Convert id to string
  }));

  // Returning the data in the format expected by the Table component
  return {
    data: processedData,
    pagination: {
      total_items: filteredData.length,
      page,
      limit,
    },
  };
};
</script>
