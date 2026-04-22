<template>
  <AppContent
    :title="t('title.create_catalog_item')"
    :description="t('subtitle.create_catalog_item_desc')"
    @submit="onSubmitDirect"
    @change-file="onChangeFile"
  >
    <div class="flex w-full min-w-0 flex-col py-6">
      <div
        class="mx-auto w-full max-w-[calc(840px+16px)] min-w-0 px-8"
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
