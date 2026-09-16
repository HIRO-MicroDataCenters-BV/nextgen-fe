<template>
  <AppContent
    :title="t('title.create_catalog_item')"
    :description="t('subtitle.create_catalog_item_desc')"
    class="lg:-mb-8"
    @submit="onSubmitDirect"
    @change-file="onChangeFile"
  >
    <!-- Desktop: fixed-height shell that fills the viewport below the 4rem
         header so the page itself never scrolls; the rail and editor panes
         scroll independently inside it. The lg:-mb-8 on AppContent collapses
         the layout slot gap (above the toast region) so content sits flush. -->
    <div class="flex w-full min-w-0 flex-col lg:h-[calc(100svh_-_4rem)]">
      <div
        class="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-8 py-6 lg:min-h-0 lg:flex-1 lg:py-3"
      >
        <AppForm
          ref="formRef"
          sync-name-from-metadata
          :title="t('title.create_catalog_item')"
          :description="t('subtitle.create_catalog_item_desc')"
          :fields="fields"
          :form-schema="formSchema"
          :initial-values="initialValues"
          :server-errors="serverErrors"
          @submit="onSubmit"
          @clear-server-errors="serverErrors = null"
        />
      </div>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { useCatalogCreatePage } from "~/composables/catalog/useCatalogCreatePage";

const { t } = useI18n();
const { saveDataset, getDataproducts } = useApi();
const {
  fields,
  formRef,
  formSchema,
  initialValues,
  onChangeFile,
  onSubmit,
  onSubmitDirect,
  serverErrors,
} = useCatalogCreatePage({
  t,
  saveDataset,
  getDataproducts,
});
</script>
