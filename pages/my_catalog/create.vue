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
import type { FormFieldDefinition } from "@/components/app/Form.vue";
import { createDatasetJsonLd } from "@/utils/jsonld";
import { hasMetadataItemTypeMismatch } from "@/utils/metadataItemTypeConsistency";
import { useDefaultDataset } from "@/components/JsonLdEditor/composables/useDefaultDataset";
import type { ApiErrorDetail } from "~/types/api.types";

const { t } = useI18n();
const { saveDataset, getDataproducts } = useApi();
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
        path: ["metadata_content"],
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

const fields = computed<FormFieldDefinition[]>(() => [
  {
    name: "name",
    label: t("label.name"),
    type: "text",
    placeholder: t("placeholder.name_from_metadata"),
    disabled: true,
  },
  {
    name: "item_type",
    label: t("label.item_type"),
    type: "select",
    placeholder: t("placeholder.select_data_product_directory"),
    options: [
      { label: t("label.dataset"), value: "dataset" },
      { label: t("label.application"), value: "application" },
    ],
    disabled: false,
  },
  {
    name: "client_selector",
    label: "",
    type: "client-selector",
    conditions: [
      {
        field: "item_type",
        value: "dataset",
      },
    ],
  },
  {
    name: "related_data_product",
    label: t("label.related_data_product"),
    type: "select",
    placeholder: t("placeholder.select_data_product"),
    dataSource: getDataproductsForClient,
    fieldOptions: {
      dataPath: "dataproducts",
    },
    hint: t("hint.related_data_product_required"),
    disabled: false,
    conditions: [
      {
        field: "item_type",
        value: "dataset",
      },
    ],
  },
  {
    name: "file",
    label: t("label.file"),
    type: "file",
    placeholder: t("placeholder.select_file"),
    hint: t("hint.accepted_file_types_json_jar"),
    accept: "application/json, application/x-tar",
    disabled: false,
  },
  {
    name: "metadata_content",
    label: t("label.metadata_content"),
    type: "jsonld-editor",
    placeholder: t("placeholder.enter_metadata_content"),
    hint: null,
    disabled: false,
  },
]);

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
  const result = await saveDataset(uploadedFilename, datasetJsonLd, {
    relatedDataProduct,
    isApplication,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultAny = result as any;
  if (resultAny && resultAny.error === true) {
    const data = resultAny.data as Record<string, unknown> | undefined;
    const detail = data?.detail;
    let errors: Array<{ code?: string; message?: string; details?: unknown[] }> = [];
    if (Array.isArray(detail) && detail.length > 0) {
      errors = detail as Array<{ code?: string; message?: string; details?: unknown[] }>;
    } else if (typeof detail === "string" && detail) {
      errors = [{ message: detail }];
    } else if (data?.message) {
      errors = [{ message: String(data.message) }];
    } else {
      errors = [{ message: "Server error occurred" }];
    }
    serverErrors.value = errors as ApiErrorDetail[];
    return;
  }

  if (result) {
    router.push("/my_catalog");
  }
};
</script>
