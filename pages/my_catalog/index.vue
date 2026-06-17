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
      :enable-view-toggle="true"
      :item-href-base="'/my_catalog'"
      :content-class="'mx-auto w-full max-w-[1600px] px-8'"
      @pass-to-training="onPassToTrainingRequest"
      @selection-context-change="onSelectionContextChange"
    />
    <TrainingOrderReviewDialog
      :open="showTrainingReviewDialog"
      :dataset="selectedDataset"
      :application="selectedApplication"
      @update:open="showTrainingReviewDialog = $event"
      @confirm="confirmTrainingOrderSubmit"
    />
    <TrainingSuccessDialog
      :open="showSuccessDialog"
      :order-id="successData?.data?.order_id"
      @update:open="showSuccessDialog = $event"
    />
  </AppContent>
</template>

<script setup lang="ts">
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";
import TrainingOrderReviewDialog from "@/components/app/TrainingOrderReviewDialog.vue";
import { useCatalogListPage } from "~/composables/catalog/useCatalogListPage";
import { useMyCatalogTrainingOrderFlow } from "~/composables/catalog/useMyCatalogTrainingOrderFlow";
import { useMyCatalogTableColumns } from "~/composables/catalog/useMyCatalogTableColumns";

const config = useRuntimeConfig();
const catalogName = config.public.catalogName;

const api = useApi();
const { t } = useI18n();
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
    runTrainingAfterCheckout: true,
    api: {
      getLocalCatalog: api.getLocalCatalog,
      searchDistributed: api.searchDistributed,
      checkout: api.checkout,
      trainingRun: (datasets, orderId, application) =>
        api.training.run(datasets, orderId, application),
    },
  });

const {
  selectedDataset,
  selectedApplication,
  showTrainingReviewDialog,
  onSelectionContextChange,
  onPassToTrainingRequest,
  confirmTrainingOrderSubmit,
} = useMyCatalogTrainingOrderFlow({ handlePassToTraining });

const { columns } = useMyCatalogTableColumns(tableRef);
</script>
