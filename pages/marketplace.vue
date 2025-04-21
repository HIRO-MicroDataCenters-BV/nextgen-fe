<template>
  <AppContent
    :title="t('title.marketplace')"
    :description="t('subtitle.marketplace')"
  >
    <AppTable
      :title="'marketplace'"
      :columns="columns"
      :dataSource="fetchTableData"
      :pageSize="10"
    />
  </AppContent>
</template>

<script setup>
const { t } = useI18n();
import { SidebarTrigger } from "@/components/ui/sidebar";
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";

const mock = useMock();

// Определение колонок для таблицы
const columns = [
  {
    id: "name",
    cell: ({ row }) => row.getValue("name"),
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
    id: "lastupdate",
    cell: ({ row }) => row.getValue("last_update"),
  },
];

// Функция для получения данных из mock
const fetchTableData = async (params) => {
  // Используем данные из mock.ts
  const mockData = mock.value.data;

  // Имитация пагинации
  const page = params.page || 1;
  const limit = params.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  // Фильтрация данных, если есть параметры поиска
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

  // Возвращаем данные в формате, ожидаемом компонентом Table
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
