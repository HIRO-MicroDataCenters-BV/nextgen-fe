<template>
  <AppContent
    :title="t(`menu.${catalogName}`)"
    :description="t('subtitle.my_catalog')"
  >
    <AppTable
      ref="tableRef"
      :title="t(`menu.${catalogName}`)"
      :columns="columns"
      :data-source="fetchTableData"
      :selection-enabled="true"
      selection-mode="single"
      :has-source-header="true"
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
import { h } from "vue";
import type { TableColumn } from "~/types/table.types";
import type { CatalogItem } from "~/types/catalog.types";
import type { DatasetMetadata } from "~/types/jsonld.types";
import { Button } from "@/components/ui/button";
import DropdownAction from "~/components/app/menu/Actions.vue";
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";
import { useCatalogListPage } from "~/composables/catalog/useCatalogListPage";
import { useCatalogShare } from "~/composables/catalog/useCatalogShare";

const config = useRuntimeConfig();
const catalogName = config.public.catalogName;

const api = useApi();
const { deleteDataset, shareDataset, unshareDataset } = api;
const { setDatasetShared } = useCatalogShare({ shareDataset, unshareDataset });
const router = useRouter();
const { t } = useI18n();
const dayjs = useDayjs();
const tableRef = ref();
const { setPage } = useApp();
setPage({
  section: "my_catalog",
  title: t(`menu.${catalogName}`),
  subtitle: t("subtitle.my_catalog"),
  source: catalogName as string,
});

const { showSuccessDialog, successData, handlePassToTraining, fetchTableData } =
  useCatalogListPage({
    source: "local",
    api: {
      getLocalCatalog: api.getLocalCatalog,
      searchDistributed: api.searchDistributed,
      checkout: api.checkout,
    },
  });

// Defining columns for the table
const columns: TableColumn[] = [
  {
    id: "name",
    icon: "lucide:text",
    header: () => t("label.data_product_name"),
    cell: ({ row }) => {
      const item = row.original as CatalogItem;
      const id = item.id;

      return h(
        Button,
        {
          href: `/my_catalog/${id}`,
          as: "a",
          variant: "link",
        },
        () => [row.getValue("name") as string]
      );
    },
  },
  {
    id: "issued",
    icon: "lucide:calendar",
    header: () => t("label.issued"),
    cell: ({ row }) => {
      const raw = row.getValue("issued") as string;
      if (!raw || !String(raw).trim()) return "—";
      const d = dayjs(raw);
      return d.isValid() ? d.format("DD/MM/YYYY") : "—";
    },
  },
  {
    id: "actions",
    icon: "lucide:circle-plus",
    iconOnly: true,
    header: () => t("label.actions"),
    cell: ({ row }) => {
      const item = row.original as unknown as DatasetMetadata;
      const id = item.id;
      const isShared = item.isShared;

      return h(DropdownAction, {
        title: row.getValue("name") as string,
        id,
        onCompleted: () => tableRef.value.fetchData(),
        items: [
          {
            key: isShared ? "unshare_dataset" : "share_dataset",
            hasConfirmation: true,
            action: () => setDatasetShared(id, !isShared),
          },
          {
            key: "edit_dataset",
            action: () => {
              router.push(`/my_catalog/${id}/edit`);
            },
          },
          {
            key: "delete_dataset",
            hasConfirmation: true,
            action: () => deleteDataset(id, { showToast: false }),
          },
        ],
      });
    },
  },
];

</script>
