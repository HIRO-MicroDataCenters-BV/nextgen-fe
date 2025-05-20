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
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";

const { t } = useI18n();
const dayjs = useDayjs();
const { page, setPage } = useApp();

setPage({
  section: 'marketplace',
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
        'a',
        { href: `${baseUrl}/${row.getValue('id')}` },
        row.getValue('biobank'),
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
const fetchTableData = async (params) => {
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
      item.name.toLowerCase().includes(params.name.toLowerCase())
    );
  }
  if (params.description) {
    filteredData = filteredData.filter((item) =>
      item.description.toLowerCase().includes(params.description.toLowerCase())
    );
  }
  if (params.biobank) {
    filteredData = filteredData.filter((item) =>
      item.type.toLowerCase().includes(params.biobank.toLowerCase())
    );
  }
  if (params.lastupdate) {
    filteredData = filteredData.filter((item) =>
      item.last_update.toLowerCase().includes(params.lastupdate.toLowerCase())
    );
  }
  if (params.all) {
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(params.all.toLowerCase()) ||
        item.description.toLowerCase().includes(params.all.toLowerCase()) ||
        item.type.toLowerCase().includes(params.all.toLowerCase()) ||
        item.last_update.toLowerCase().includes(params.all.toLowerCase())
    );
  }

  // Returning the data in the format expected by the Table component
  return {
    data: filteredData.slice(start, end),
    pagination: {
      total_items: filteredData.length,
      page,
      limit,
    },
  };
};
</script>
