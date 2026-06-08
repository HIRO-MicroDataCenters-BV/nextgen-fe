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
import TrainingSuccessDialog from "@/components/app/TrainingSuccessDialog.vue";
import { useCatalogListPage } from "~/composables/catalog/useCatalogListPage";
import { useMarketplaceTableColumns } from "~/composables/catalog/useMarketplaceTableColumns";

const { t } = useI18n();
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

const { columns } = useMarketplaceTableColumns(page.value.section);
</script>
