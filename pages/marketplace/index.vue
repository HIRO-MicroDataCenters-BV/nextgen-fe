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
} from "~/types/catalog.types";
import type { TableColumn } from "~/types/table.types";
import Button from "@/components/ui/button/Button.vue";
import AppContent from "@/components/app/Content.vue";
import AppTable from "@/components/app/Table.vue";
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";
import { useCatalogListPage } from "~/composables/catalog/useCatalogListPage";

const { t } = useI18n();
const dayjs = useDayjs();
const { page, setPage } = useApp();
const api = useApi();

const { showSuccessDialog, successData, handlePassToTraining, fetchTableData } =
  useCatalogListPage({
    source: "distributed",
    api: {
      getLocalCatalog: api.getLocalCatalog,
      searchDistributed: api.searchDistributed,
      checkout: api.checkout,
    },
  });

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

</script>
