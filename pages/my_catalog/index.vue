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
      @pass-to-training="handlePassToTrainingClick"
      @selection-context-change="handleSelectionContextChange"
    />
    <TrainingOrderReviewDialog
      :open="showTrainingReviewDialog"
      :dataset="selectedDataset"
      :application="selectedApplication"
      @update:open="showTrainingReviewDialog = $event"
      @confirm="submitTrainingOrder"
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
import { Button } from "@/components/ui/button";
import DropdownAction from "~/components/app/menu/Actions.vue";
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";
import TrainingOrderReviewDialog from "@/components/app/TrainingOrderReviewDialog.vue";
import { useCatalogListPage } from "~/composables/catalog/useCatalogListPage";
import { useTrainingOrder } from "~/composables/training/useTrainingOrder";

const config = useRuntimeConfig();
const catalogName = config.public.catalogName;

const api = useApi();
const { deleteDataset } = api;
const router = useRouter();
const { t } = useI18n();
const dayjs = useDayjs();
const tableRef = ref();
const showTrainingReviewDialog = ref(false);
const { setPage } = useApp();
const toaster = useToaster();
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

const { selectedDataset, selectedApplication, setSelection } = useTrainingOrder();

const handleSelectionContextChange = (value: {
  selectedType: string;
  selectedIds: string[];
  selectedRaw: Array<Record<string, unknown>>;
}) => {
  if (value.selectedType === "datasets" || value.selectedType === "applications") {
    setSelection(value.selectedType, value.selectedRaw, value.selectedIds[0] ?? null);
  }
};

const handlePassToTrainingClick = () => {
  if (!selectedDataset.value) {
    toaster.show("error", "Select a dataset before passing to training.");
    return;
  }
  showTrainingReviewDialog.value = true;
};

const submitTrainingOrder = async (value: { includeApplication: boolean }) => {
  if (!selectedDataset.value) {
    toaster.show("error", "Application cannot be sent without a dataset.");
    return;
  }

  await handlePassToTraining({
    dataset: [selectedDataset.value],
    application:
      value.includeApplication && selectedApplication.value
        ? selectedApplication.value
        : null,
  });
  showTrainingReviewDialog.value = false;
};

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
      const item = row.original as CatalogItem;
      const id = item.id;

      return h(DropdownAction, {
        title: row.getValue("name") as string,
        id,
        items: [
          {
            key: "delete_dataset",
            label: "delete_dataset",
            hasConfirmation: true,
            action: async () => {
              await deleteDataset(id);
              tableRef.value.fetchData();
            },
          },
          {
            key: "edit_dataset",
            label: "edit_dataset",
            action: () => {
              router.push(`/my_catalog/${id}/edit`);
            },
          },
        ],
      });
    },
  },
];

</script>
