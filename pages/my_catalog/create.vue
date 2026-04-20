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
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";
import { createDatasetJsonLd } from "@/utils/jsonld";
import { hasMetadataItemTypeMismatch } from "@/utils/metadataItemTypeConsistency";
import { useDefaultDataset } from "@/components/JsonLdEditor/composables/useDefaultDataset";
import type { ApiErrorDetail } from "~/types/api.types";
import { useCatalogSubmit } from "~/composables/catalog/useCatalogSubmit";
import { useCatalogFormFields } from "~/composables/catalog/useCatalogFormFields";

const { t } = useI18n();
const { saveDataset, getDataproducts } = useApi();
const { saveCatalogItem } = useCatalogSubmit({ saveDataset });
const { selectedClient } = useClientSelector();
const router = useRouter();
const serverErrors = ref<ApiErrorDetail[] | null>(null);

// Wrap getDataproducts to pass the currently selected client interface
const getDataproductsForClient = () => {
  return getDataproducts(selectedClient.value ?? "local");
};

const formSchema = computed(() =>
  z
    .object({
      name: z.string().optional(),
      item_type: z.string().min(1),
      related_data_product: z.string().optional().nullable(),
      file: z
        .any()
        .refine((val) => val !== null && val !== undefined && val !== ""),
      metadata_content: z.union([z.record(z.unknown()), z.string()]).optional(),
    })
    .refine(
      (data) =>
        data.item_type !== "dataset" ||
        (data.related_data_product &&
          String(data.related_data_product).trim()),
      {
        message: t("validation.related_data_product_required"),
        path: ["related_data_product"],
      }
    )
    .refine(
      (data) =>
        !hasMetadataItemTypeMismatch(data.metadata_content, data.item_type),
      {
        message: t("jsonld.editor.validation.item_type_mismatch"),
        path: ["item_type"],
      }
    )
);

const formRef = ref();
const { buildDefaultMetadataContentObject } = useDefaultDataset();

watch(selectedClient, () => {
  formRef.value?.refreshFieldOptions?.("related_data_product");
});

const initialValues = {
  name: "",
  item_type: "dataset",
  related_data_product: null,
  file: null,
  metadata_content: buildDefaultMetadataContentObject(),
};

const fields = computed(() =>
  useCatalogFormFields({
    t,
    mode: "create",
    getDataproductsForClient,
  }),
);

const onChangeFile = (_file: File) => {
  // File changed
};
const onSubmitDirect = () => {
  formRef.value.submit();
};

const onSubmit = async (formValues: Record<string, unknown>) => {
  const uploadedFilename = formRef.value?.getUploadedFile?.("file");

  if (!uploadedFilename) {
    console.error(
      "[my_catalog/create] Save aborted: no uploaded filename (file field or DCAT-only flow)",
    );
    serverErrors.value = [
      { message: t("validation.catalog_save_missing_filename") },
    ];
    return;
  }

  const datasetJsonLd = createDatasetJsonLd(formValues, uploadedFilename);

  const isApplication = formValues.item_type === "application";

  const relatedDataProduct =
    formValues.related_data_product &&
    typeof formValues.related_data_product === "string"
      ? formValues.related_data_product.trim() || null
      : null;

  serverErrors.value = null;
  const result = await saveCatalogItem({
    filename: uploadedFilename,
    datasetJsonLd,
    relatedDataProduct,
    isApplication,
  });

  if (!result.ok) {
    serverErrors.value = result.errors as ApiErrorDetail[];
    return;
  }

  router.push("/my_catalog");
};
</script>
