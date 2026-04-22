<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
  >
    <div
      v-if="loading"
      class="flex w-full min-w-0 flex-col py-6"
    >
      <div
        class="mx-auto flex h-64 w-full max-w-[calc(840px+16px)] items-center justify-center px-8"
      >
        <Spinner class="size-8" />
      </div>
    </div>
    <div
      v-else-if="!formReady"
      class="flex w-full min-w-0 flex-col py-10"
    >
      <div
        class="mx-auto w-full max-w-[calc(840px+16px)] px-8 text-center"
      >
        <p>{{ t("status.item_not_found") }}</p>
        <Button class="mt-4" @click="goBackToCatalog">
          {{ t("action.back_to_catalog") }}
        </Button>
      </div>
    </div>
    <div v-else class="flex w-full min-w-0 flex-col py-6">
      <div
        class="mx-auto w-full max-w-[calc(840px+16px)] min-w-0 px-8"
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
