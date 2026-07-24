<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
    class="lg:-mb-8"
  >
    <div
      v-if="loading"
      class="flex w-full min-w-0 flex-col py-6"
    >
      <div
        class="mx-auto flex h-64 w-full max-w-[1600px] items-center justify-center px-8"
      >
        <Spinner class="size-8" />
      </div>
    </div>
    <div
      v-else-if="!formReady"
      class="flex w-full min-w-0 flex-col py-10"
    >
      <div
        class="mx-auto w-full max-w-[1600px] px-8 text-center"
      >
        <p>{{ t("status.item_not_found") }}</p>
        <Button class="mt-4" @click="goBackToCatalog">
          {{ t("action.back_to_catalog") }}
        </Button>
      </div>
    </div>
    <!-- Desktop: fixed-height shell that fills the viewport below the 4rem
         header so the page itself never scrolls; the rail and editor panes
         scroll independently inside it. The lg:-mb-8 on AppContent collapses
         the layout slot gap (above the toast region) so content sits flush. -->
    <div
      v-else
      class="flex w-full min-w-0 flex-col lg:h-[calc(100svh_-_4rem)]"
    >
      <div
        class="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-8 py-6 lg:min-h-0 lg:flex-1 lg:py-3"
      >
        <AppForm
          :id="datasetId"
          :key="datasetId"
          ref="formRef"
          :title="t('title.edit_catalog_item')"
          :description="t('subtitle.edit_catalog_item_desc')"
          :fields="fields"
          :form-schema="formSchema"
          :initial-values="initialValues!"
          :server-errors="serverErrors"
          @submit="onSubmit"
          @clear-server-errors="serverErrors = null"
        />
      </div>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { Spinner } from "@/components/ui/spinner";
import { useCatalogEditPage } from "~/composables/catalog/useCatalogEditPage";

const { t } = useI18n();
const { saveDataset, getDataset } = useApi();
const {
  datasetId,
  fields,
  formReady,
  formRef,
  formSchema,
  goBackToCatalog,
  initialValues,
  loading,
  onSubmit,
  page,
  serverErrors,
} = useCatalogEditPage({
  t,
  getDataset,
  saveDataset,
});
</script>
